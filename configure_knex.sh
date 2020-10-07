#!/bin/bash

container_name=$1
if [[ -z $container_name ]]; then
    echo "docker image wasn't specified, exit ..."
    exit 1
fi

docker exec -it $container_name /docker_images/docker_build.sh

should_reset=$2
if [[ $should_reset = "-r" ]]; then
    docker exec -it $container_name bash -c "yarn reset-db"
else
    docker exec -it $container_name bash -c "yarn create-admin"
    echo "'-r' flag is not specified. Sample data wasn't populated"
fi
