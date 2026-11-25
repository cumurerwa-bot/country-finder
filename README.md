# Country Finder

Country Finder is a website for looking up countries. You can search by name, filter by region and sort by name or population. Each card shows the flag, capital, region, population, languages and currencies. It helps travelers and students compare countries in one place.

Live (through the load balancer): http://18.132.10.117

## API used
- REST Countries API by the REST Countries team: https://restcountries.com
- Documentation: https://restcountries.com/docs
- Endpoint: `https://api.restcountries.com/countries/v5`
- The API key is sent in the `Authorization: Bearer <key>` header, as the documentation recommends.

## Features
- Search by country name, filter by region, sort by name (A-Z) or population (high to low)
- Clear error message if the API is down, the key is missing or the data is invalid
- Data cached in the browser for 1 hour to reduce API calls
- API text inserted with `textContent`, which protects against XSS
- The API key lives in `config.js`, which is git-ignored and never pushed to GitHub

## Known limitation
The free REST Countries plan returns at most 100 countries per request, so the app currently shows 100 countries. Loading the rest would need extra requests using the API's `offset` parameter.

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
      v
lb-01  (18.132.10.117)  HAProxy, round robin
      |                         |
      v                         v
web-01 (18.170.66.177)    web-02 (52.56.73.27)
Nginx serves the app      Nginx serves the app
```

Both web servers run the same code. Each one adds an `X-Served-By` header with its hostname, so you can see which server answered.

## Deploy to web-01 and web-02
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
   `deploy/web-nginx.conf` serves `/var/www/country-finder` on port 80 and adds the header `X-Served-By $hostname`.
3. Create `config.js` on the server (it is not in GitHub, so it must be added by hand):
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

To deploy a new version later, run on each web server:
```
cd /var/www/country-finder && sudo git pull
```
`git pull` does not touch `config.js`, so the key stays in place.

## Configure the load balancer (lb-01, 18.132.10.117)
lb-01 runs **HAProxy**, installed and configured in the earlier load balancer project. HAProxy listens on port 80 and sends each request to web-01 or web-02 in turn (round robin). The `check` option makes HAProxy health-check each server, so if one server goes down, all traffic goes to the other.

Configuration in `/etc/haproxy/haproxy.cfg`:
```
frontend http_front
    bind *:80
    mode http
    default_backend http_back

backend http_back
    mode http
    balance roundrobin
    server 7417-w
