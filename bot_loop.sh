#!/bin/bash

NODEJS_BIN=/root/.nvm/versions/node/v8.17.0/bin/./node

while :
do
	$NODEJS_BIN index.js
	echo "Tipbot crashed! [CTRL+C] to stop.."
	sleep 1
done