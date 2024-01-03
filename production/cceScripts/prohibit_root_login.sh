#!/bin/bash

# Prompt for root privileges
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script with root privileges."
  exit 1
fi

# Location of the sshd_config file
config_file="/etc/ssh/sshd_config"

# Desired PermitRootLogin setting
new_setting="no"

# Check if the sshd_config file exists
if [ ! -f "$config_file" ]; then
  echo "sshd_config file not found at $config_file."
  exit 1
fi

# Backup the original sshd_config file
backup_file="$config_file.bak"
cp "$config_file" "$backup_file"

# Update the PermitRootLogin setting
sed -i "s/^#*\s*PermitRootLogin.*/PermitRootLogin $new_setting/" "$config_file"

# Restart the SSH service
service_command="service ssh restart"

if [ -x "$(command -v systemctl)" ]; then
  service_command="systemctl restart sshd"
fi

$service_command

echo "PermitRootLogin has been updated to '$new_setting' in sshd_config."
echo "Original configuration file backed up to $backup_file."
echo "SSH service has been restarted."

exit 0

