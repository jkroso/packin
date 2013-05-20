#!/usr/bin/env bash

printf "installing config to '~/.packin'\n"

PCKHOME="${HOME}/.packin"

if [[ ! -d "$PCKHOME" ]]; then
	mkdir "$PCKHOME"
fi

if [[ ! -d "${PCKHOME}/-" ]]; then
	mkdir "${PCKHOME}/-"
fi

if [[ ! -f "${PCKHOME}/locals.json" ]]; then
	echo "{}" > "${PCKHOME}/locals.json"
fi

declare -a json=(
	"{"
	"  \"target\": \"node_modules\","
	"  \"meta\": ["
	"    \"deps.json\","
	"    \"component.json\","
	"    \"package.json\""
	"  ],"
	"  \"deps\": false"
	"}"
)

if [[ ! -f "${PCKHOME}/config.json" ]]; then
	printf "%s\n" "${json[@]}" > "${PCKHOME}/config.json"
fi

unset json
unset PCKHOME
