#!/bin/bash

if [[ $1 = "release" ]]; then
	docker-compose -f d.be.prod.yml down
elif [[ $1 = "stage" ]]; then
	docker-compose -f d.be.stage.yml down
elif [[ $1 = "debug" ]]; then
	docker-compose -f d.be.debug.yml down
else
	echo "No config was provided. It should be either debug or release"
fi
