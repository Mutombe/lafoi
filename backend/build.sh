#!/usr/bin/env bash
# Render build script. Set as the "Build Command" on the Render web service.
# Stops the build if any step fails.
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate --no-input
