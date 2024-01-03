# ---------------------
# version: v1.0.3
# ---------------------

#!/bin/bash
# Check if the .env file exists
if [ -f ../.env ]; then
    # Restore the database using the environment variables from the .env file
    source ../.env
    if [ -z "$1" ]; then
        # Restore pg_dump file not provided
        echo "pg_dump file not provided."
    else
        echo "pg_dump file: $1"
        DUMP_FILE="$1"

        if [[ $(sudo systemctl is-active postgresql) -eq 0 ]]; then
            # postgresql is active and can be backed up
            export PGPASSWORD=$POSTGRES_PASSWORD
            psql -U $POSTGRES_USER -h localhost -d $POSTGRES_DB -f $DUMP_FILE
            echo "DONE"
        else
            echo "postgresql is not active."
        fi
    fi    
else
    echo "The .env file does not exist"
fi