# Database Notes

When updating schema files in this folder, prefer migration-safe changes.

Rules:
- Do not assume an existing table can be dropped and recreated.
- Keep `CREATE TABLE IF NOT EXISTS ...` for fresh installs.
- For changes to existing tables, add conditional `ALTER TABLE` statements using `INFORMATION_SCHEMA` checks.
- Follow the pattern used in [vip_meta.sql](/Users/colinzhou/Desktop/test/dadi360_2026/database/vip_meta.sql) and [vip_whitelist.sql](/Users/colinzhou/Desktop/test/dadi360_2026/database/vip_whitelist.sql).
- Preserve existing data whenever possible.

In short: treat schema updates in this folder like migrations, not destructive rebuilds.
