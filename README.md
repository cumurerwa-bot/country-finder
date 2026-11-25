# Country Finder

Country Finder is a website for looking up countries. You can search by name, filter by region and sort by name or population. Each card shows the flag, capital, region, population, languages and currencies.

- **Live site:** https://cumurerwa.tech (also https://www.cumurerwa.tech)
- **Load balancer IP:** http://18.132.10.117
- **Demo video:** PASTE_YOUR_YOUTUBE_LINK_HERE
- **Repository:** https://github.com/cumurerwa-bot/country-finder

## Purpose
Travelers, students and anyone curious about the world often need quick, reliable facts about a country: its capital, population, languages and currency. Country Finder puts this information in one place and lets users compare countries by searching, filtering by region and sorting by population.

## API used (credit)
- **REST Countries API** by the REST Countries team: https://restcountries.com
- Documentation: https://restcountries.com/docs
- Endpoint: `https://api.restcountries.com/countries/v5`
- The API key is sent in the `Authorization: Bearer <key>` header, as the documentation recommends.
- Plan limits: the free plan returns at most 100 countries per request (see Known limitations).

## Features
- **Search** by country name (updates as you type)
- **Filter** by region: Africa, Americas, Asia, Europe, Oceania
- **Sort** by name (A-Z) or population (high to low)
- Search, filter and sort work together, and the page shows how many countries match
- Clear cards with flag, capital, region, population, languages and currencies

## Error handling
- If the API is down, returns an error (for example 401 or 403) or the network fails, the page shows a clear message instead of crashing, for example: *"Could not load countries. Check your internet and reload the page. The API returned an error (401)."*
- If the API sends data in an unexpected format, the app detects it and shows an error message.
- If a search or filter matches nothing, the page says *"No countries match your search."*
- Missing values (for example a country with no capital) are shown as "None" or "Unknown".

## Bonus tasks completed
- **Caching:** API responses are saved in the browser (`localStorage`) for 1 hour, so repeat visits load instantly and use fewer API requests.
- **Security:** all text from the API is inserted with `textContent` (never `innerHTML`) to prevent XSS, and the site is served over **HTTPS** with a Let's Encrypt certificate.

## API key handling
- The real key lives in `config.js`, which is listed in `.gitignore` and is **never pushed to GitHub**.
- The repository only contains `config.example.js` with a placeholder (`YOUR_API_KEY_HERE`).
- The API key for grading is provided in the submission comment.
- On the servers, `config.js` is created by hand (see Deployment).
- The key's **CORS allowed origins** on restcountries.com are limited to:
```
  localhost, 127.0.0.1, 18.132.10.117, 18.170.66.177, 52.56.73.27, cumurerwa.tech, www.cumurerwa.tech
```
  so other websites cannot use the key from a browser.
- Note: this is a frontend-only app, so `config.js` is downloaded by the browser and visitors can see the key. CORS limits where it can be used. A fully hidden key would need a small backend server.

## Run locally
1. Clone the repository:
```
   git clone https://github.com/cumurerwa-bot/country-finder.git
   cd country-finder
```
2. Get a free API key at https://restcountries.com/sign-up
3. On the API Keys page, add `localhost, 127.0.0.1` to the key's CORS allowed origins
4. Copy the example config and put your key in it:
```
   cp config.example.js config.js
```
   `config.js` should contain: `const API_KEY = "your_key_here";`
5. In VS Code, right-click `index.html` and choose **Open with Live Server**

## Architecture

```
                 User's browser
                       |
       https://cumurerwa.tech  (DNS A records -> 18.132.10.117)
                       |
                       v
     lb-01 (18.132.10.117)  HAProxy
     - port 443: HTTPS (Let's Encrypt certificate)
     - port 80:  HTTP
     - round robin + health checks
              |                         |
              v                         v
   web-01 (18.170.66.177)     web-02 (52.56.73.27)
   Nginx serves the app       Nginx serves the app
```

Both web servers run the same code. Each one adds an `X-Served-By` header with its hostname, so you can see which server answered a request.

## Deployment to web-01 and web-02
Run these on **each** web server (`ssh ubuntu@18.170.66.177`, then `ssh ubuntu@52.56.73.27`):

1. Install git and download the app:
```
   sudo apt update && sudo apt install -y git
   sudo git clone https://github.com/cumurerwa-bot/country-finder.git /var/www/country-finder
```
2. Install the Nginx site config from the repo and enable it:
```
   sudo cp /var/www/country-finder/deploy/web-nginx.conf /etc/nginx/sites-available/country-finder
   sudo ln -sf /etc/nginx/sites-available/country-finder /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
```
   `deploy/web-nginx.conf`:
```
   server {
       listen 80 default_server;
       root /var/www/country-finder;
       index index.html;
       add_header X-Served-By $hostname always;

       location / {
           try_files $uri $uri/ =404;
       }
   }
```
3. Create `config.js` on the server (it is not in GitHub, so it is added by hand):
```
   echo 'const API_KEY = "YOUR_API_KEY";' | sudo tee /var/www/country-finder/config.js
```
4. Check the config and reload Nginx:
```
   sudo nginx -t && sudo systemctl reload nginx
```
5. Check the server:
```
   curl -sI localhost | grep X-Served-By
   curl -s localhost | grep title
```

**Updating to a new version:** run on each web server, one at a time, so the other server keeps serving users (no downtime):
```
cd /var/www/country-finder && sudo git pull
```
`git pull` does not touch `config.js`, so the key stays in place.

## Load balancer configuration (lb-01, 18.132.10.117)
lb-01 runs **HAProxy**. It receives all traffic and sends each request to web-01 or web-02 in turn (**round robin**). The `check` option makes HAProxy health-check each server, so if one server goes down, all traffic goes to the other and users still get the site.

Configuration in `/etc/haproxy/haproxy.cfg`:
```
frontend http_front
    bind *:80
    bind *:443 ssl crt /etc/haproxy/certs/cumurerwa.tech.pem
    http-request redirect scheme https code 301 if { hdr(host) -i cumurerwa.tech www.cumurerwa.tech } !{ ssl_fc }
    mode http
    default_backend http_back

backend http_back
    mode http
    balance roundrobin
    server 7417-web-01 18.170.66.177:80 check
    server 7417-web-02 52.56.73.27:80 check
```

- `bind *:80` and `bind *:443 ssl ...`: listen for HTTP and HTTPS.
- `http-request redirect ...`: visitors using the domain over HTTP are sent to HTTPS.
- `balance roundrobin`: requests alternate between the two servers.
- `check`: unhealthy servers are removed automatically.

HAProxy decrypts HTTPS (SSL termination) and forwards plain HTTP to the web servers on port 80, so the web servers did not need any SSL setup.

Validate and restart after any change:
```
sudo haproxy -c -f /etc/haproxy/haproxy.cfg
sudo service haproxy restart
```

## Domain and HTTPS
1. **DNS:** at the domain registrar, A records point `cumurerwa.tech` (`@`) and `www.cumurerwa.tech` to the load balancer `18.132.10.117`.
2. **Certificate:** a free certificate from Let's Encrypt was obtained on lb-01 with certbot (HAProxy is stopped briefly so certbot can use port 80):
```
   sudo apt install -y certbot
   sudo service haproxy stop
   sudo certbot certonly --standalone --cert-name cumurerwa.tech -d cumurerwa.tech -d www.cumurerwa.tech
   sudo service haproxy start
```
3. **Certificate file for HAProxy:** HAProxy needs the certificate and private key in one file:
```
   sudo mkdir -p /etc/haproxy/certs
   sudo bash -c 'cat /etc/letsencrypt/live/cumurerwa.tech/fullchain.pem /etc/letsencrypt/live/cumurerwa.tech/privkey.pem > /etc/haproxy/certs/cumurerwa.tech.pem'
   sudo chmod 600 /etc/haproxy/certs/cumurerwa.tech.pem
```
4. **HAProxy:** the `bind *:443 ssl ...` and redirect lines shown above were added, the config was validated, and HAProxy was restarted.
5. **CORS:** `cumurerwa.tech` and `www.cumurerwa.tech` were added to the API key's allowed origins.

The certificate is valid until 2027-02-23. To renew it, repeat steps 2 and 3 and restart HAProxy.

## Testing
1. **Each web server answers with its own name:**
```
   curl -sI 18.170.66.177 | grep X-Served-By   # X-Served-By: 7417-web-01
   curl -sI 52.56.73.27 | grep X-Served-By     # X-Served-By: 7417-web-02
```
2. **The load balancer alternates between them:**
```
   for i in 1 2 3 4 5 6; do curl -sI 18.132.10.117 | grep X-Served-By; done
```
   Result:
```
   X-Served-By: 7417-web-01
   X-Served-By: 7417-web-02
   X-Served-By: 7417-web-01
   X-Served-By: 7417-web-02
   X-Served-By: 7417-web-01
   X-Served-By: 7417-web-02
```
3. **HTTPS works through the load balancer:**
```
   curl -sI https://cumurerwa.tech | grep -i -E "HTTP|X-Served-By"
   curl -sI https://www.cumurerwa.tech | grep -i -E "HTTP|X-Served-By"
```
   Both return `HTTP/1.1 200 OK`, answered by web-01 or web-02.
4. **The app works in the browser:** at https://cumurerwa.tech the countries load, and search, region filter and sort all work. In DevTools (Network tab), the `X-Served-By` header changes between `7417-web-01` and `7417-web-02` on reload.

## Known limitations
- The free REST Countries plan returns at most 100 countries per request, so the app shows 100 countries. Loading the rest would need extra requests with the API's `offset` parameter.
- The API key is visible in the browser (frontend-only app); it is protected by CORS and kept out of GitHub.
- The certificate must be renewed manually before 2027-02-23.

## Credits
- REST Countries API by the REST Countries team: https://restcountries.com
- Let's Encrypt and Certbot (free SSL certificates): https://letsencrypt.org
- HAProxy documentation: https://www.haproxy.org/
- Nginx documentation: https://nginx.org/en/docs/
- Live Server extension by Ritwick Dey, used for local testing
- An AI assistant was used for guidance and debugging

## Challenges
- The API I first planned to use stopped working without a key, so I moved to the v5 API and kept the key in a git-ignored `config.js` file.
- Opening the page directly from a file gave "failed to fetch", so I used the Live Server extension and added localhost to the key's CORS allowed origins.
- My first API key was accidentally committed in `config.example.js`. I revoked it on restcountries.com, created a new key, and replaced the example file with a placeholder.
- After creating the new key, the API returned 401 because the key had not been added to `config.js` yet. Adding it fixed the error.
- The servers did not have git installed, so I installed it before cloning the repository.
- My domain only had a `www` record, so I added an `@` A record for `cumurerwa.tech` before requesting the certificate.
- After enabling HTTPS, I added the domain to the API key's CORS origins so the app could call the API from the new address.

