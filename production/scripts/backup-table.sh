# ---------------------
# postgresql backup (exclude table datas)
# version: v1.1.0
# ---------------------

#!/bin/bash
# Check if the .env file exists
if [ -f ../.env ]; then
    # Back up the database
    source ../.env
    if [[ $(sudo systemctl is-active postgresql) -eq 0 ]]; then
        # postgresql is active and can be backed up
        export PGPASSWORD=$POSTGRES_PASSWORD
        # --exclude-table-data
        sudo pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -h localhost --exclude-table-data=notification --exclude-table-data=permission_request --exclude-table-data=qr_job --exclude-table-data=reset_password_request --exclude-table-data=session > backup-table-$(date +"%Y%m%dT%H:%M:%S").dump
      
        echo "DONE"
    else
        echo "postgresql is not active."
    fi
else
    echo "The .env file does not exist"
fi