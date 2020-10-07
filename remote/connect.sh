#!/bin/bash

server_mode=$1
if [[ -z $server_mode ]]; then
    echo "not specified mode: either debug or release ..."
    exit 1
fi

if [[ $server_mode = "release" ]]; then
    ssh def_user@142.93.165.212
elif [[ $server_mode = "debug" ]]; then
    ssh def_user@142.93.171.171
fi
