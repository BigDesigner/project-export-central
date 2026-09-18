#!/usr/bin/env python3
import os
import re
import sys

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dump_file = os.path.join(root_dir, "old_db_dump.sql")
    out_file = os.path.join(root_dir, "clean_migration.sql")

    if not os.path.exists(dump_file) or os.path.getsize(dump_file) == 0:
        print("Notice: old_db_dump.sql not found or empty. Creating minimal dummy migration file.")
        with open(out_file, "w", encoding="utf-8") as f:
            f.write("-- No old database dump to migrate\nSELECT 1;\n")
        return

    print(f"Reading dump file: {dump_file} ({os.path.getsize(dump_file)} bytes)")
    with open(dump_file, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    clean_lines = [
        "-- Cleaned D1 Migration Dump for TenderPulse",
        "PRAGMA foreign_keys = OFF;",
        ""
    ]

    for line in lines:
        stripped = line.strip()
        # Skip transaction wrappers and pragma lines that interfere with wrangler execute
        if stripped.upper() in ("BEGIN TRANSACTION;", "COMMIT;", "PRAGMA FOREIGN_KEYS=ON;", "PRAGMA FOREIGN_KEYS = ON;"):
            continue
        if stripped.upper().startswith("BEGIN ") or stripped.upper() == "COMMIT;":
            continue

        # Convert CREATE TABLE to CREATE TABLE IF NOT EXISTS
        if re.match(r"^\s*CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)", line, re.IGNORECASE):
            line = re.sub(r"^\s*CREATE\s+TABLE\s+", "CREATE TABLE IF NOT EXISTS ", line, flags=re.IGNORECASE)

        # Convert INSERT INTO to INSERT OR IGNORE INTO
        if re.match(r"^\s*INSERT\s+INTO\s+", line, re.IGNORECASE):
            line = re.sub(r"^\s*INSERT\s+INTO\s+", "INSERT OR IGNORE INTO ", line, flags=re.IGNORECASE)

        clean_lines.append(line.rstrip())

    clean_lines.append("")
    clean_lines.append("PRAGMA foreign_keys = ON;")

    with open(out_file, "w", encoding="utf-8") as f:
        f.write("\n".join(clean_lines) + "\n")

    print(f"Successfully created {out_file} with {len(clean_lines)} lines.")

if __name__ == "__main__":
    main()
