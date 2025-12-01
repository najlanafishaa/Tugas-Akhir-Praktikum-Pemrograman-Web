const API_KEY = "60b598a6e182ccccd4eb487e670dc7f8";

let unit = "metric";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const refreshBtn = document.getElementById("refreshBtn");
const toggleUnitBtn = document.getElementById("toggleUnit");
const themeBtn = document.getElementById("themeBtn");
const themeIcon = document.getElementById("themeIcon");
const favBtn = document.getElementById("favBtn");
const loading = document.getElementById("loading");

const locationEl = document.getElementById("location");
const timestampEl = document.getElementById("timestamp");
const weatherIconEl = document.getElementById("weatherIcon");
const temperatureEl = document.getElementById("temperature");
const descriptionEl = document.getElementById("description");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const forecastBox = document.getElementById("forecastBox");

const favoriteList = document.getElementById("favoriteList");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

function getWeather(city) {
  loading.classList.remove("hidden");

  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${unit}&lang=id`)
    .then(r => r.json())
    .then(data => {
      loading.classList.add("hidden");

      locationEl.textContent = data.name;
      timestampEl.textContent = new Date().toLocaleString("id-ID");

      const temp = data.main.temp;
      temperatureEl.textContent = temp + (unit === "metric" ? "°C" : "°F");

      descriptionEl.textContent = data.weather[0].description;
      humidityEl.textContent = "Humidity: " + data.main.humidity + "%";
      windEl.textContent = "Wind: " + data.wind.speed + " " + (unit === "metric" ? "m/s" : "mph");

      weatherIconEl.src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    });
}

function getForecast(city) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${unit}&lang=id`)
    .then(r => r.json())
    .then(data => {
      forecastBox.innerHTML = "";

      const daily = {};

      data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];
        if (!daily[date]) daily[date] = item;
      });

      Object.keys(daily).slice(0, 5).forEach(date => {
        const d = daily[date];

        const box = document.createElement("div");
        box.className =
          "p-4 bg-gray-100 dark:bg-gray-800 dark:border dark:border-gray-700 rounded-xl text-center shadow transition";

        box.innerHTML = `
          <p class="font-semibold">${date}</p>
          <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png" class="mx-auto">
          <p>${d.main.temp_min}° / ${d.main.temp_max}°</p>
          <p class="text-sm">${d.weather[0].description}</p>
        `;

        forecastBox.appendChild(box);
      });
    });
}

function loadCity(city) {
  getWeather(city);
  getForecast(city);
}

searchBtn.addEventListener("click", () => {
  if (cityInput.value === "") return;
  loadCity(cityInput.value);
});

refreshBtn.addEventListener("click", () => {
  if (locationEl.textContent !== "-") {
    loadCity(locationEl.textContent);
  }
});

setInterval(() => {
  if (locationEl.textContent !== "-") loadCity(locationEl.textContent);
}, 300000);

favBtn.addEventListener("click", () => {
  const city = locationEl.textContent;
  if (!city || city === "-") return;

  if (!favorites.includes(city)) {
    favorites.push(city);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    renderFavorites();
  }
});

function renderFavorites() {
  favoriteList.innerHTML = "";

  favorites.forEach(city => {
    const btn = document.createElement("button");
    btn.className =
      "w-full text-left p-2 mb-2 rounded-lg bg-gray-200 dark:bg-gray-700 dark:text-white";
    btn.textContent = city;

    btn.onclick = () => loadCity(city);
    favoriteList.appendChild(btn);
  });

  if (favorites.length === 0) {
    favoriteList.innerHTML =
      `<p class="text-sm text-gray-500 dark:text-gray-300">Belum ada favorit.</p>`;
  }
}

renderFavorites();

themeBtn.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");

  if (document.documentElement.classList.contains("dark")) {
    themeIcon.classList.replace("fa-moon", "fa-sun");
  } else {
    themeIcon.classList.replace("fa-sun", "fa-moon");
  }
});

toggleUnitBtn.addEventListener("click", () => {
  unit = unit === "metric" ? "imperial" : "metric";
  if (locationEl.textContent !== "-") loadCity(locationEl.textContent);
});
