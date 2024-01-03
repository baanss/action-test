#!/bin/bash

# Change the owner of the file to root
sudo chown root /etc/shadow

# Set the permissions to 400 (read-only for root)
sudo chmod 400 /etc/shadow

# Verify the changes
ls -l /etc/shadow
