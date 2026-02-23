import * as L from "https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js";

// 📍 Get data from URL
const params = new URLSearchParams(window.location.search);

const lat = parseFloat(params.get("lat"));
const lon = parseFloat(params.get("lon"));
const radius = parseInt(params.get("radius")) || 3000;

// 🗺️ Create map
const map = L.map("map").setView([lat, lon], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// user marker
L.marker([lat, lon]).addTo(map).bindPopup("You are here").openPopup();


// Fetch nearby places
async function getNearbyPlaces(lat, lon, radius, category) {

  let filter = `
  node["tourism"~"attraction|museum|gallery|viewpoint"](around:${radius}, ${lat}, ${lon});
  node["historic"](around:${radius}, ${lat}, ${lon});
  node["amenity"="place_of_worship"](around:${radius}, ${lat}, ${lon});
`;

  if (category === "tourism") {
    filter = `node["tourism"](around:${radius}, ${lat}, ${lon});`;
  }

  if (category === "historic") {
    filter = `node["historic"](around:${radius}, ${lat}, ${lon});`;
  }

  if (category === "temple") {
    filter = `node["amenity"="place_of_worship"](around:${radius}, ${lat}, ${lon});`;
  }

  const query = `
    [out:json];
    (${filter});
    out;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query
  });

  const data = await res.json();
  return data.elements;
}

function getCategoryImage(tags) {
  if (tags?.amenity === "place_of_worship") {
    return "Images/temple.png";
  }

  if (tags?.historic) {
    return "Images/historic.png";
  }

  if (tags?.tourism) {
    return "Images/tourism.png";
  }

  return "images/default.png";
}


// 🖼️ Get image (Wikipedia + fallback)
async function getPlaceImage(name, tags) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    );

    if (!res.ok) throw new Error();

    const data = await res.json();

    // ✅ Wikipedia image
    if (data.thumbnail?.source) {
      return data.thumbnail.source;
    }

    // ✅ fallback
    return getCategoryImage(tags);

  } catch {
    return getCategoryImage(tags);
  }
}



// 🧾 Show places
async function displayPlaces(places) {
  const container = document.getElementById("places");
  container.innerHTML = "Loading...";

  container.innerHTML = "";

  const limited = places.slice(0, 12);

  for (let place of limited) {
    const name = place.tags?.name;
    if (!name) continue;

    const pLat = place.lat;
    const pLon = place.lon;

    // map marker
    L.marker([pLat, pLon]).addTo(map).bindPopup(name);

    const img = await getPlaceImage(name, place.tags);
    const distance = getDistance(lat, lon, pLat, pLon).toFixed(2);

    const card = `
      <div class="card">
        <img src="${img}" onerror="this.src='images/default.jpg'" />
        <div class="card-content">
          <h3>${name}</h3>
          <div class="distance center">${distance} km away</div>
        </div>
      </div>
    `;

    container.innerHTML += card;
  }
}

const rangeInput = document.getElementById("range");
const rangeValue = document.getElementById("rangeValue");
const categorySelect = document.getElementById("category");
const sortSelect = document.getElementById("sort");

rangeInput.value = radius;
rangeValue.textContent = radius/1000;

rangeInput.addEventListener("input", () => {
  rangeValue.textContent = rangeInput.value/1000;
});

function sortPlaces(places, userLat, userLon, type) {

  if (type === "nearest") {
    return places.sort((a, b) => {
      const d1 = getDistance(userLat, userLon, a.lat, a.lon);
      const d2 = getDistance(userLat, userLon, b.lat, b.lon);
      return d1 - d2;
    });
  }

  if (type === "name") {
    return places.sort((a, b) => {
      const n1 = a.tags?.name || "";
      const n2 = b.tags?.name || "";
      return n1.localeCompare(n2);
    });
  }

  return places;
}

async function reloadData() {
  try {
    applyBtn.disabled = true;
    applyBtn.innerText = "Applying...";

    const radius = parseInt(rangeInput.value);
    const category = categorySelect.value;
    const sortType = sortSelect.value;

    let places = await getNearbyPlaces(lat, lon, radius, category);

    places = sortPlaces(places, lat, lon, sortType);

    await displayPlaces(places);

  } catch (err) {
    console.error(err);
    alert("Reload failed");
  } finally {
    applyBtn.disabled = false;
    applyBtn.innerText = "Apply Filters";
  }
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI/180;
  const dLon = (lon2 - lon1) * Math.PI/180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) *
    Math.sin(dLon/2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

const applyBtn = document.getElementById("applyBtn");

applyBtn.addEventListener("click", () => {
  reloadData();
});

async function init() {
  try {
    let places = await getNearbyPlaces(lat, lon, radius, "all");

    places = sortPlaces(places, lat, lon, "nearest");

    await displayPlaces(places);

  } catch (err) {
    console.error(err);
    alert("Failed to load places");
  }
}

init();