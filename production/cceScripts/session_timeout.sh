#!/bin/sh

# Check if the line already exists
if ! grep -q "export TMOUT=300" /etc/profile
then
  # If the line doesn't exist, add it
  echo 'export TMOUT=300' | sudo tee -a /etc/profile
  echo "TMOUT value set to 300 seconds in /etc/profile"
else
  echo "The line already exists in /etc/profile"
fi
