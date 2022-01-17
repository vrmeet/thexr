#!/bin/bash
git push gigalixir master && curl -ig "https://api.honeybadger.io/v1/deploys?deploy[environment]=prod&deploy[local_username]=Homan&deploy[repository]=git@github.com:vrmeet/thexr.git&deploy[revision]=$(git rev-parse --short HEAD)&api_key=d839a21f"
