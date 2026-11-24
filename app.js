const API_URL = "https://api.restcountries.com/countries/v5?limit=100&response_fields=names.common,capitals,region,population,languages,currencies,flag.url_svg";
const searchBox = document.getElementById("search"); 
 const regionBox = document.getElementById("region");
 const sortBox = document.getElementById("sort");
 const message = document.getElementById("message");
 const results = document.getElementById("results");
 
 let countries = [];
 
 async function loadCountries() {
try {
    const saved = JSON.parse(localStorage.getItem('countries3') || "null");
if (saved && saved.data.length > 0 && Date.now() - saved.time < 3600000) {
    countries = saved.data;
    showCountries();
    return;
}
    


    const response = await fetch(API_URL + "&api-key=" + API_KEY);

if (!response.ok) throw new Error("The API returned an error (" + response.status + ").");
const data = await response.json();
if (!data.data || !Array.isArray(data.data.objects))  throw new Error("The API sent data in an unexpected format.");

countries = data.data.objects.map(convert);
localStorage.setItem('countries3', JSON.stringify({ time: Date.now(), data: countries }));
showCountries();
} catch (error) {
    message.className = "error";
    message.textContent = "Could not load countries. Check your internet and reload the page. " + error.message;
}
}
function convert(o) {
    return {
        name: { common: (o.names && o.names.common) || "Unknown" },
        capital: o.capitals && o.capitals.length > 0 ? [o.capitals[0].name] : null,
        region: o.region || "Unknown",
        population: o.population || 0,
        languages: (o.languages || []).map(function (x) { return x.name; }),
       currencies: o.currencies || null,
        flags: { svg: o.flag && o.flag.url_svg ? o.flag.url_svg : "" }
    };
}
function showCountries() {
    if (countries.length === 0) return;
    const text = searchBox.value.trim().toLowerCase();
    const region = regionBox.value;

    const list = countries.filter(function (c) {
        return c.name.common.toLowerCase().includes(text) && (region === "" || c.region === region);
    });

    if (sortBox.value === "population") {
        list.sort(function (a, b) { return b.population - a.population; });
    } else {
        list.sort(function (a, b) { return a.name.common.localeCompare(b.name.common); });
    }

    message.className = "";
    message.textContent = list.length === 0
    ? "No countries match your search. Try a different name or region,"
    : list.length + " countries found.";
    results.innerHTML = "";

    list.forEach(function (c) {
        
    
        const card =document.createElement("div");
        card.className = "card";

        const flag = document.createElement("img");
        flag.src = c.flags.svg;
        flag.alt = "Flag of " + c.name.common;

        const title = document.createElement("h2");
        title.textContent = c.name.common;

        const capital = c.capital ? c.capital[0] : "None";
        const language = c.languages ? Object.values(c.languages).join(", ") : "Unknown";
        const currencies = c.currencies ? Object.values(c.currencies).map(function (x) { return x.name; }).join(", ") : "Unknown";
        card.append(flag, title);
        [
            "capital: " + capital,
            "region: " + c.region,
            "population: " + c.population.toLocaleString(),
            "languages: " + language,
            "currencies: " + currencies
        ].forEach(function (line) {
            const p = document.createElement("p");
            p.textContent = line;
            card.appendChild(p);
        });

        results.appendChild(card);
    });
}


searchBox.addEventListener("input", showCountries);
regionBox.addEventListener("change", showCountries);
sortBox.addEventListener("change", showCountries);


loadCountries();


