#!/bin/sh
set -e

flask db upgrade
exec flask run --host=0.0.0.0 --port=8000
