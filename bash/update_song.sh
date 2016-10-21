#!/bin/bash -ex

for i in {1..9}
do
    echo "Update $i / 9"

    curl -X POST \
         -H "X-Parse-Application-Id: ${APPLICATION_NAME}" \
         -H "X-Parse-Master-Key: ${MASTER_KEY}" \
         -H "Content-Type: application/json" \
         http://localhost:1337/parse/functions/updateCurrentSong

    echo ""

    curl -X POST \
         -H "X-Parse-Application-Id: ${APPLICATION_NAME}" \
         -H "X-Parse-Master-Key: ${MASTER_KEY}" \
         -H "Content-Type: application/json" \
         http://localhost:1337/parse/functions/fixSomeSongsWithoutLyricsState

    sleep 6
done