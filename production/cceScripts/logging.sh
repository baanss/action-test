#!/bin/bash

# Backup the existing configuration file
sudo cp /etc/rsyslog.conf /etc/rsyslog.conf.bak

# Create a new rsyslog.conf file with the specified configurations
sudo bash -c "cat > /etc/rsyslog.conf" <<'EOF'
*.info;mail.none;authpriv.none;cron.none /var/log/messages
authpriv.* /var/log/secure
mail.* -/var/log/maillog
cron.* /var/log/cron
*.emerg :omusrmsg:*
*.alert root
*.alert /dev/console
*.emerg *
EOF

# Restart the rsyslog service for the changes to take effect
sudo systemctl restart rsyslog
