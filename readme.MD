# Environment preparation
## No docker

0. unix-like system (not mandatory)
1. nodeJS 8+
2. postgresql 10+
3. authorize in psql (for macOS only)
```
psql postgres
```
4. create db
```
CREATE DATABASE db;
```
5. create default user (do it if not exists)
```
CREATE USER defuser WITH password 'yzP-fgW-66M-FgH';
```
6. grant permissions on database 'db' to default user
```
GRANT ALL ON DATABASE db TO defuser;
```
7. \q

7. install knex globally (do it if not exists)
```
sudo npm i -g knex
```
8. go to sql folder in project
```
cd sql
```
9. run migrate script
```
knex migrate:latest
```
10. grant permissions on all tables to default user
```
for tbl in `psql -qAt -c "select tablename from pg_tables where schemaname = 'public';" db` ; do  psql -c "alter table \"$tbl\" owner to defuser" db ; done
```
11. clear existing rows and add sample data to database
```
yarn reset-db
```

## Docker

1. Docker version 17.12.1-ce, (build 7390fc6)
2. docker-compose version 1.22.0, (build f46880fe)

`Dockerfile` is a docker config file for backend container

`docker-compose.yml` is a docker-compose config for postgres and backend containers together. Here is postgres configuration (user_name, database_name, password)

`restart_docker.sh` should launch container using `docker-compose.yml` file. No additional params are required

```
sh restart_docker.sh
```

If containers are build from scratch then run `configure_knex.sh` to configure knex & data base relationships
- first parameter is docker container id. `st_back` can be used or container id from `docker ps` command
- if the second param is `-r` then sample data will be paste (analogue of `yarn reset-db`)

```
sh configure_knex.sh st_back -r
```

Server will be available on 3010 port (configurable from docker-compose file): `http://localhost:3010`

`backup.sh` with `st_postgres` param will make a db snapshot stored in current folder

`restore.sh` with `st_postgres` param and dump db file specified will set postgres data to that file. It's highly recommended to make postgres container clean (it's better to make clean container)

For cleaning containers cache completely `../postgres-data` should be deleted. In addition to it, `docker-compose rm` should be called to remove containers (`docker-compose.yml` config file be used). `clean_up_volume.sh` cleans  `../postgres-data` directory.

Execute bash inside container
```
docker exec -it $container_id bash
```

## Install

```
cd ./${projectFolder}
yarn install
```

## Run

```
yarn start
```

## For change superuser password
```
node adminUtility --email=admin@asdf.com --password=1
```
