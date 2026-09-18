import json
import os

def escape_sql_string(val):
    if val is None:
        return "NULL"
    # Convert to string and escape single quotes
    s = str(val).replace("'", "''")
    return f"'{s}'"

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    deep_data_dir = os.path.join(os.path.dirname(root_dir), "data")
    out_sql_file = os.path.join(root_dir, "tender_seed.sql")

    countries_file = os.path.join(deep_data_dir, "countries.json")
    with open(countries_file, "r", encoding="utf-8") as f:
        countries = json.load(f)

    sql_statements = [
        "-- Auto-generated Tender Intelligence Seed SQL for Cloudflare D1",
        "-- Safe idempotent execution: INSERT OR REPLACE",
        ""
    ]

    total_companies = 0
    total_sources = 0

    # 1. Countries
    sql_statements.append("-- 1. Tender Countries")
    for c in countries:
        c_id = escape_sql_string(c.get("id"))
        c_name = escape_sql_string(c.get("name"))
        c_flag = escape_sql_string(c.get("flag"))
        c_count = c.get("count", 0)
        c_active = 1 if c.get("active", True) else 0
        sql_statements.append(
            f"INSERT OR REPLACE INTO tender_countries (id, name, flag, count, active) "
            f"VALUES ({c_id}, {c_name}, {c_flag}, {c_count}, {c_active});"
        )

    sql_statements.append("")
    sql_statements.append("-- 2. Tender Companies & Sources")

    for c in countries:
        country_id = c.get("id")
        data_file = os.path.join(deep_data_dir, f"{country_id}.json")
        if not os.path.exists(data_file):
            continue

        with open(data_file, "r", encoding="utf-8") as f:
            companies = json.load(f)

        for comp in companies:
            total_companies += 1
            cid = escape_sql_string(comp.get("id"))
            country_ref = escape_sql_string(country_id)
            name = escape_sql_string(comp.get("name"))
            group_name = escape_sql_string(comp.get("group"))
            category = escape_sql_string(comp.get("category"))
            city = escape_sql_string(comp.get("city"))
            priority = escape_sql_string(comp.get("priority"))
            phone = escape_sql_string(comp.get("phone"))
            email = escape_sql_string(comp.get("email"))
            email_alt = escape_sql_string(comp.get("email_alt"))
            address = escape_sql_string(comp.get("address"))
            project_officer = escape_sql_string(comp.get("project_officer"))

            exec_data = comp.get("executive") or {}
            owner_group = escape_sql_string(exec_data.get("owner_group"))
            ceo = escape_sql_string(exec_data.get("ceo"))
            cpo = escape_sql_string(exec_data.get("cpo"))
            cfo = escape_sql_string(exec_data.get("cfo"))
            strategy_note = escape_sql_string(exec_data.get("strategy_note"))

            project_reference = escape_sql_string(comp.get("project_reference"))
            source_text = escape_sql_string(comp.get("source_text"))

            sql_statements.append(
                f"INSERT OR REPLACE INTO tender_companies ("
                f"id, country_id, name, group_name, category, city, priority, "
                f"phone, email, email_alt, address, project_officer, "
                f"owner_group, ceo, cpo, cfo, strategy_note, project_reference, source_text"
                f") VALUES ("
                f"{cid}, {country_ref}, {name}, {group_name}, {category}, {city}, {priority}, "
                f"{phone}, {email}, {email_alt}, {address}, {project_officer}, "
                f"{owner_group}, {ceo}, {cpo}, {cfo}, {strategy_note}, {project_reference}, {source_text}"
                f");"
            )

            # Sources
            sources = comp.get("source_urls") or []
            for s in sources:
                total_sources += 1
                s_label = escape_sql_string(s.get("label"))
                s_url = escape_sql_string(s.get("url"))
                sql_statements.append(
                    f"INSERT OR IGNORE INTO tender_source_urls (company_id, label, url) "
                    f"VALUES ({cid}, {s_label}, {s_url});"
                )

    with open(out_sql_file, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_statements) + "\n")

    print(f"Generated {out_sql_file}")
    print(f"Total Countries: {len(countries)}")
    print(f"Total Companies: {total_companies}")
    print(f"Total Source URLs: {total_sources}")

if __name__ == "__main__":
    main()
