#!/bin/bash

# Specify desired minimum password length
MIN_PASS_LENGTH=8
MIN_PASS_DAYS=1
MAX_PASS_DAYS=90

# Check if root user
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi
# Backup the original file
cp /etc/login.defs /etc/login.defs.bak

# Change the minimum password length
sed -i "s/\(PASS_MIN_LEN\).*$/\1\t$MIN_PASS_LENGTH/" /etc/login.defs
sed -i "s/\(PASS_MIN_DAYS\).*$/\1\t$MIN_PASS_DAYS/" /etc/login.defs
sed -i "s/\(PASS_MAX_DAYS\).*$/\1\t$MAX_PASS_DAYS/" /etc/login.defs

echo "Minimum password length set to $MIN_PASS_LENGTH"
echo "Maximum days a password may be used set to $MAX_PASS_DAYS"
echo "Minimum days a password may be used set to $MIN_PASS_DAYS"
