#!/bin/sh
set -e

echo "Starting application..."
# Database is already configured on the server
# No migrations needed - just start the app
exec node server.js
