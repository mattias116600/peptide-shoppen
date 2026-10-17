# Driftsätta Peptidesweden på Ubuntu-VPS

Testat: Ubuntu 22.04/24.04, Node.js 22.13 eller senare (krävs för inbyggda `node:sqlite`), Nginx, Let's Encrypt.

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
npm install
npm run build:vps               # skapar .output/
sudo chown -R www-data:www-data /var/www/peptidesweden
```

## 3. Starta som tjänst
```bash
sudo cp deploy/peptidesweden.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now peptidesweden
curl -I http://127.0.0.1:3000   # ska ge 200
```

## 4. Skapa admin-konto
Ordrar, rabattkoder och admin-konton sparas i en SQLite-fil på servern (`DATABASE_PATH` i `.env`, standard `data/peptidesweden.db`). Det finns ingen registreringssida – konton skapas bara här:
```bash
cd /var/www/peptidesweden
sudo -u www-data node --env-file=.env --disable-warning=ExperimentalWarning scripts/admin.mjs create mattias   # frågar efter lösenord (minst 12 tecken)
sudo -u www-data node --env-file=.env --disable-warning=ExperimentalWarning scripts/admin.mjs list
sudo -u www-data node --env-file=.env --disable-warning=ExperimentalWarning scripts/admin.mjs password mattias # byter lösenord och loggar ut alla sessioner
sudo -u www-data node --env-file=.env --disable-warning=ExperimentalWarning scripts/admin.mjs delete mattias
```
Logga sedan in på `https://peptidesweden.com/admin`. Sessionen gäller i 12 timmar; efter 5 felaktiga försök från samma IP spärras inloggningen i 15 minuter.

## 5. Kryptobetalning med NOWPayments
1. Logga in på NOWPayments: under **Settings → Payments** ställer du in utbetalningsplånbok, och under **Settings → Payments → API keys** skapar du en API-nyckel.
2. Under **Settings → Payments → Instant payment notifications** genererar du en *IPN secret key* (den visas bara en gång) och sätter IPN-adressen till `https://peptidesweden.com/api/nowpayments/ipn`. Shoppen skickar även adressen med varje faktura.
3. Lägg in nycklarna i `/var/www/peptidesweden/.env`:
   ```bash
   NOWPAYMENTS_API_KEY=din-api-nyckel
   NOWPAYMENTS_IPN_SECRET=din-ipn-nyckel
   PUBLIC_SITE_URL=https://peptidesweden.com
   ```
4. `sudo systemctl restart peptidesweden`

Så fungerar det: kassan skapar en faktura i SEK och skickar kunden till NOWPayments betalsida. NOWPayments meddelar `/api/nowpayments/ipn` (signerat med IPN-nyckeln) när betalningen ändrar status. När hela beloppet är bekräftat sätts ordern automatiskt till **Betald** i `/admin`. Delbetalningar, utgångna och misslyckade betalningar loggas i orderns historik men ändrar inte orderstatus – hantera dem manuellt. Utan nycklar fungerar kassan som tidigare: ordern sparas och du markerar den betald manuellt.

## 6. Nginx + HTTPS
```bash
sudo mkdir -p /var/www/certbot
sudo certbot certonly --nginx -d peptidesweden.com -d www.peptidesweden.com
sudo cp deploy/nginx-peptidesweden.conf /etc/nginx/sites-available/peptidesweden
sudo ln -sf /etc/nginx/sites-available/peptidesweden /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```
Certifikatet förnyas automatiskt (`systemctl list-timers | grep certbot`).

## Säkerhetskopiera ordrar, produkter och blogg
Databasen ligger i `data/` (ignoreras av git och skrivs aldrig över vid uppdatering). Ta en konsekvent kopia medan sajten kör, t.ex. varje natt via cron:
```bash
sudo -u www-data sqlite3 /var/www/peptidesweden/data/peptidesweden.db ".backup '/var/backups/peptidesweden-$(date +%F).db'"
sudo tar -czf "/var/backups/peptidesweden-bilder-$(date +%F).tgz" -C /var/www/peptidesweden/data uploads
```
(`sudo apt install -y sqlite3` om kommandot saknas.) Databasen innehåller ordrar, rabattkoder, admin-konton, produkter och bloggartiklar; `data/uploads/` innehåller bilder som laddats upp i admin.

## Produkter och blogg
Produkter hanteras i `/admin/produkter` och artiklar i `/admin/blogg`. Vid första start kopieras dagens sortiment och de tio artiklarna in i databasen; därefter är det admin som gäller (ändringar i `src/lib/products.ts` och `src/lib/articles.ts` påverkar bara nya installationer). Om du uppdaterar Nginx-konfigurationen från repot: `sudo cp deploy/nginx-peptidesweden.conf /etc/nginx/sites-available/peptidesweden && sudo nginx -t && sudo systemctl reload nginx` – den tillåter bilduppladdningar upp till 5 MB.

## Uppdatera sajten
Alla 13 bilder finns lokalt i `src/assets/` och typsnitten i `public/fonts/`.
`npm run build:vps` tar med dem i `.output/public/`; inga bild- eller typsnittsförfrågningar behöver gå till Lovable eller Google.
Behåll hela `.output/` när du kopierar ett färdigt bygge till servern, inte bara `.output/server/`.
Telegram och externa CoA-rapporter är fortfarande externa länkar.

```bash
cd /var/www/peptidesweden && git pull && npm install && npm run build:vps
sudo chown -R www-data:www-data . && sudo systemctl restart peptidesweden
```

## Felsökning
- Loggar: `journalctl -u peptidesweden -f` och `/var/log/nginx/error.log`
- 502 i webbläsaren = tjänsten är nere → `sudo systemctl status peptidesweden`
