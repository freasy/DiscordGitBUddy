#!/bin/sh

if [ ! -f "/app/database/database.sqlite" ]; then
    cp /app/init/database.sqlite /app/database/
fi

npm run start
