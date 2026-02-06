---
"swarm-mail": patch
---

fix(memory): self-heal missing columns in memories table

The migration system was importing PGlite migrations (`memoryMigrations`) instead
of libSQL migrations (`memoryMigrationsLibSQL`), causing schema drift. Columns
defined in the Drizzle schema (`tags`, `updated_at`, `decay_factor`, `access_count`,
`last_accessed`, `category`, `status`) were never added via migrations.

Added `healMemorySchema()` that runs after every migration pass — checks
`pragma_table_info` for missing columns and adds them idempotently. Databases
created via migrations, convenience functions, or PGlite migration all converge
on the correct schema.

Also added v12 migration marker and fixed the import to use `memoryMigrationsLibSQL`.
