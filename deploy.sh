#!/bin/bash


if [ -f .env ]; then

    set -o allexport
    source .env
    set +o allexport

    git push gigalixir && curl -ig "https://api.honeybadger.io/v1/deploys?deploy[environment]=prod&deploy[local_username]=Homan&deploy[repository]=git@github.com:vrmeet/thexr.git&deploy[revision]=$(git rev-parse --short HEAD)&api_key=$HONEYBADGER_API_KEY"

else

  echo "I'm expecting a .env file"

fi
