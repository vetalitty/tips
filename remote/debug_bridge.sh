#!/bin/bash

# creates ssh bridge between local machine and debug machine for debugging session
ssh -L 9220:127.0.0.1:9229 def_user@142.93.171.171