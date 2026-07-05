#! /usr/bin/env bash

set -e
set -x

# Let the DB start
python app/backend_pre_start.py

# Run migrations
alembic upgrade head

# Create initial data in DB
python app/initial_data.py

# Start the API server
# Railway (and other PaaS) inject the port to bind to via $PORT.
# Fall back to 8000 for docker compose / local usage where PORT isn't set.
exec fastapi run --workers 4 --port "${PORT:-8000}" app/main.py
