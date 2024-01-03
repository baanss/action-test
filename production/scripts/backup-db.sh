# ---------------------
# postgresql backup
# version: v1.0.3
# ---------------------

#!/bin/bash
# Check if the .env file exists
if [ -f ../.env ]; then
    # Back up the database
    source ../.env
    if [[ "$(sudo systemctl is-active postgresql)" == "active" ]]; then
        # postgresql is active and can be backed up
        export PGPASSWORD=$POSTGRES_PASSWORD
        sudo pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -h localhost > backup-$(date +"%Y%m%dT%H:%M:%S").dump
        echo "DONE"
    else
        echo "postgresql is not active."
    fi
else
    echo "The .env file does not exist"
fi