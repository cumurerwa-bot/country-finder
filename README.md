# Country Finder

Country Finder is a website for looking up countries. You can search by name, filter by region and sort by name or population. Each card shows the flag, capital, region, population, languages and currencies. It helps travelers and students compare countries in one place.

## API used
- REST Countries API by the REST Countries team: https://restcountries.com
- Documentation: https://restcountries.com/docs

## Features
- Search, region filter and sorting
- Clear error message if the API is down, the key is missing or the data is invalid
- Data cached in the browser for 1 hour
- API text inserted with textContent, which protects against XSS
- The API key lives in config.js, which is git-ignored

## Run locally
1. Clone the repository: git clone https://github.com/cumurerwa-bot/country-finder.git
2. Get a free API key at https://restcountries.com/sign-up
3. On the API Keys page, add localhost,127.0.0.1 to CORS allowed origins
4. In the project folder, copy config.example.js to config.js and put your key in it
5. In VS Code, right-click index.html and choose Open with Live Server
 
 ## Deploy to web01 and web02 
 web01 is 18.170.66.177 and web02 is 52.56.73.27. Run on each server:

 sudo apt update && sudo apt install -y nginx git
 sudo git clone https://github.com/cumurerwa-bot/country-finder.git /var/www/country-finder
 sudo cp /var/www/country-finder/deploy/web-nginx conf /etc/nginx/sites-
 available/country-finder
 sudo In -sf /etc/nginx/sites-available/country-finder /etc/nginx/sites-enabled/ 
 sudo rm -f /etc/nginx/sites-enabled/default
 sudo nginx -t && sudo systemctl reload nginx

 the API key file is not in github. Copy config.js from your computer to each server:

 scp -i ~/.ssh/school config.js ubuntu@SERVER_IP:/tmp/config.js ssh -i ~/.ssh/school ubuntu@SERVER_IP 
 "sudo mv /tmp/config.js /var/www/country-finder/config.js"

 The server IPs are added to CORS allowed origins on the API key, otherwise the API returns 403