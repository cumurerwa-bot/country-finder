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
