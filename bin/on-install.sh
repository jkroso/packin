#!/usr/bin/env bash

printf "installing config to '~/.packin'\n"

PCKHOME="${HOME}/.packin"

if [[ ! -d "$PCKHOME" ]]; then
  mkdir "$PCKHOME"
fi

if [[ ! -d "${PCKHOME}/-" ]]; then
  mkdir "${PCKHOME}/-"
fi

declare -a json=(
  '{'
  '  "folder": "dependencies",'
  '  "meta": ["dependencies.json"]'
  '}'
)

if [[ ! -f "${PCKHOME}/config.json" ]]; then
  printf "%s\n" "${json[@]}" > "${PCKHOME}/config.json"
fi

unset json
unset PCKHOME
