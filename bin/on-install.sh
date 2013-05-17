#!/usr/bin/env bash

printf "installing config to '~/.packin'\n"

PCKHOME="${HOME}/.packin"

if [[ -d "$PCKHOME" ]]; then
	printf "'~/.packin' already exists\n"
else
	mkdir "$PCKHOME"
fi

if [[ ! -f "${PCKHOME}/locals.json" ]]; then
	echo "{}" > "${HOME}/.packin/locals.json"
fi

declare -a cfg=(
	"{"
	"  \"target\": \"deps\","
	"  \"meta\": ["
	"    \"deps.json\","
	"    \"component.json\","
	"    \"package.json\""
	"  ],"
	"  \"deps\": false"
	"}"
)

if [[ ! -f "${PCKHOME}/config.json" ]]; then
	printf "%s\n" "${cfg[@]}" > "${PCKHOME}/config.json"
fi

unset cfg
