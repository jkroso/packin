#!/usr/bin/env bash

printf "installing config to '~/.packin'\n"

PCKHOME="${HOME}/.packin"

if [[ ! -d "$PCKHOME" ]]; then
	mkdir "$PCKHOME"
fi

if [[ ! -d "${PCKHOME}/-" ]]; then
	mkdir "${PCKHOME}/-"
fi

if [[ ! -f "${PCKHOME}/links.json" ]]; then
	echo "{}" > "${PCKHOME}/links.json"
fi

declare -a json=(
	"{"
	"  \"folder\": \"node_modules\","
	"  \"meta\": ["
	"    \"deps.json\","
	"    \"component.json\","
	"    \"package.json\""
	"  ],"
	"  \"dev\": true"
	"}"
)

if [[ ! -f "${PCKHOME}/config.json" ]]; then
	printf "%s\n" "${json[@]}" > "${PCKHOME}/config.json"
fi

unset json
unset PCKHOME
