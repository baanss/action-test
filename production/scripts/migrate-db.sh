# ---------------------
# version: v1.0.2
# ---------------------

#!/bin/bash
# Check if the .env file exists
if [ -f ../.env ]; then
    # Back up the database and copy it to the host machine using the environment variables from the .env file
    source ../.env
    if [ -z "$1" ]; then
        #Container name not provided
        echo "No Container Name provided."
    else
        echo "Container name: $1"
        CONTAINER_NAME="$1"
        if sudo docker container inspect $CONTAINER_NAME >/dev/null 2>&1; then

            if [[ "$(sudo docker container inspect -f '{{.State.Status}}' $CONTAINER_NAME)" == "running" ]]; then
                #Container is running and can be backed up
                echo "$CONTAINER_NAME is running."
                sudo docker exec $CONTAINER_NAME pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql
                export PGPASSWORD=$POSTGRES_PASSWORD
                psql -U $POSTGRES_USER -h localhost -d $POSTGRES_DB -f backup.sql
                sudo rm backup.sql
                echo "DONE"
            else
                #Container is not running
                echo "$CONTAINER_NAME is not running."
            fi
        else
            #Container does not exist
            echo "Container does not exist."
        fi       
    fi    
else
    echo "The .env file does not exist"
fi