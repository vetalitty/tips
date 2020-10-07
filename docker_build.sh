#!/bin/bash

npm i -g knex
cd sql
knex migrate:latest
cd ..
