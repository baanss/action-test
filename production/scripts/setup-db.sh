# ---------------------
# version: v1.0.2
# ---------------------

#!/bin/bash

# Check if the .env file exists
if [ -f ../.env ]; then
    # Create the user and database using the environment variables from the .env file
    source ../.env    
    sudo -u postgres psql -c "CREATE USER $POSTGRES_USER WITH CREATEDB CREATEROLE SUPERUSER PASSWORD '$POSTGRES_PASSWORD';"
    export PGPASSWORD=$POSTGRES_PASSWORD
    sudo psql -U $POSTGRES_USER -h localhost -d postgres -c "CREATE DATABASE $POSTGRES_DB;" 
    echo "DONE"
else
    echo "The .env file does not exist"
fi