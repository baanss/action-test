#!/bin/bash

# Define the file path
file_path="/etc/pam.d/system-auth"

# Define the lines to add
line1="auth required /lib/security/pam_tally.so deny=5 unlock_time=120 no_magic_root"
line2="account required /lib/security/pam_tally.so no_magic_root reset"

# Check if the file exists
if [ ! -f $file_path ]; then
    # If it does not exist, create it
    sudo touch $file_path
fi

# Check if the lines already exist in the file
if ! grep -Fxq "$line1" $file_path; then
    echo "$line1" | sudo tee -a $file_path
fi

if ! grep -Fxq "$line2" $file_path; then
    echo "$line2" | sudo tee -a $file_path
fi
