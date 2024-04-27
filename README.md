# Drizzle init-project

[![CI](https://github.com/Neo-Ciber94/drizzle-init/actions/workflows/ci.yml/badge.svg)](https://github.com/Neo-Ciber94/drizzle-init/actions/workflows/ci.yml)

Initialize a project with drizzle-orm.

```bash
npm init drizzle-project@latest
```

## Usage

```text
Usage: create-drizzle-project [options]

Initialize drizzle-orm in a project

Options:
  -V, --version               output the version number
  -d, --driver <string>       Database driver to use (mysql, postgres, sqlite)
  -p, --dbProvider <string>   Database provider to use
  -c, --configType <string>   Drizzle config file type (typescript, javascript)
  -m, --migrateFile <string>  Migration file path
  -o, --outDir <string>       Output directory (default: "./drizzle")
  -b, --databaseDir <string>  Directory for the database and schema files
  -i, --install               Whether if install the dependencies
  --no-install                No install dependencies
  -h, --help                  display help for command
```
