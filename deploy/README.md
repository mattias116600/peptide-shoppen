# Driftsätta Peptidesweden på Ubuntu-VPS

Testat: Ubuntu 22.04/24.04, Node.js 22, Nginx, Let's Encrypt.

## 1. Förbered servern (en gång)
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx git ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```
DNS: A-post för `peptidesweden.com` och `www` → serverns IP.

## 2. Hämta och bygg
```bash
sudo mkdir -p /var/www/peptidesweden && sudo chown $USER /var/www/peptidesweden
git clone <ditt-repo> /var/www/peptidesweden && cd /var/www/peptidesweden
cp .env.example .env            # justera vid behov
npm ci
npm run build:vps               # skapar .output/
sudo chown -R www-data:www-data /var/www/peptidesweden
```

## 3. Starta som tjänst
```bash
sudo cp deploy/peptidesweden.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now peptidesweden
curl -I http://127.0.0.1:3000   # ska ge 200
```

## 4. Nginx + HTTPS
```bash
sudo mkdir -p /var/www/certbot
sudo certbot certonly --nginx -d peptidesweden.com -d www.peptidesweden.com
sudo cp deploy/nginx-peptidesweden.conf /etc/nginx/sites-available/peptidesweden
sudo ln -sf /etc/nginx/sites-available/peptidesweden /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```
Certifikatet förnyas automatiskt (`systemctl list-timers | grep certbot`).

## Uppdatera sajten
```bash
cd /var/www/peptidesweden && git pull && npm ci && npm run build:vps
sudo chown -R www-data:www-data . && sudo systemctl restart peptidesweden
```

## Felsökning
- Loggar: `journalctl -u peptidesweden -f` och `/var/log/nginx/error.log`
- 502 i webbläsaren = tjänsten är nere → `sudo systemctl status peptidesweden`
