#!/bin/bash

if [[ $1 = "release" ]]; then
	docker-compose -f d.be.prod.yml up -d --build
elif [[ $1 = "stage" ]]; then
	docker-compose -f d.be.stage.yml up -d --build
elif [[ $1 = "debug" ]]; then
	docker-compose -f d.be.debug.yml up -d --build
else
	echo "No config was provided. It should be either debug or release"
fi
