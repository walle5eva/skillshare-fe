#!/bin/bash
curl -o openapi.json "https://skillshare-app-drgr4.ondigitalocean.app/openapi.json"
python3 openapi_client_util.py
openapi-generator-cli generate -i openapi_modified.json -g typescript-axios -o ./api
rm openapi.json openapi_modified.json
rm openapitools.json
rm api/.openapi-generator-ignore
rm api/.gitignore
rm api/.npmignore
rm api/git_push.sh
rm -rf api/.openapi-generator
rm -rf api/docs
