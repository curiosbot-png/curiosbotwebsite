#!/bin/bash
# One-time VPS hardening for a fresh Ubuntu/Debian Hostinger VPS. Run as root AFTER you have confirmed key-based SSH login works
# for a non-root sudo user — this script disables password and root SSH login. Review before running.
set -euo pipefail
: "${DEPLOY_USER:?set DEPLOY_USER (existing non-root sudo user with your SSH key installed)}"
id "$DEPLOY_USER" >/dev/null

apt-get update -y && DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
apt-get install -y ufw fail2ban unattended-upgrades curl ca-certificates

# Firewall: only SSH, HTTP, HTTPS. (Docker publishes 80/443 only; Postgres has no published port.)
ufw default deny incoming; ufw default allow outgoing
ufw allow OpenSSH; ufw allow 80/tcp; ufw allow 443/tcp; ufw allow 443/udp
ufw --force enable

# SSH: keys only, no root login
install -d /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/99-curiosbot.conf <<CONF
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
MaxAuthTries 3
AllowUsers $DEPLOY_USER
CONF
sshd -t && systemctl reload ssh || systemctl reload sshd

systemctl enable --now fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades

# Docker (official convenience script) if missing
command -v docker >/dev/null || (curl -fsSL https://get.docker.com | sh)
usermod -aG docker "$DEPLOY_USER"
echo "Hardening complete. Test a NEW ssh session as $DEPLOY_USER before closing this one."
