#!/bin/sh
set -e

cd /app

npm ci

exec "$@"
