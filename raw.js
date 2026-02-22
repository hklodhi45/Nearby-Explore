import * as L from "https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js";

const map = L.map('map').setView([20, 78], 5); // default India view

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// // Button click
  const place = "Kanpur"; // Replace with user input
  let city;

  const coords = await getCoordinates(place);

navigator.geolocation.getCurrentPosition(
  (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    console.log("Latitude:", lat);
    console.log("Longitude:", lon);
    getNearbyPlaces(lat,lon);
  },
  (error) => {
    console.log("Error:", error.message);
  }
);
  if (coords) {
    map.setView([26.50018907375326, 80.27397112052432], 13);
    L.marker([26.50018907375326, 80.27397112052432])
      .addTo(map)
      .bindPopup("me")
      .openPopup("hello");
  }

// // Geocoding function
async function getCoordinates(place) {
  const apiKey = "67a2c88292c3425f8758e59244ec1922";

  const url = `https://api.opencagedata.com/geocode/v1/json?q=${place}&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status.code !== 200) {
    console.error("API Error:", data.status.message);
    alert("API Error: " + data.status.message);
    return null;
  }
  console.log(data);

  if (data.results.length > 0) {
    return {
      lat: data.results[0].geometry.lat,
      lon: data.results[0].geometry.lng,
      city: data.results[0].components.state_district || data.results[0].components.town || data.results[0].components.village || "Unknown"
    };
  } else {
    alert("Location not found");
    return null;
  }
}
console.log(coords);
city = coords.city;


async function getWikiData(place, city) {
  const searchQuery = `${place} ${city}`;

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${searchQuery}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    return {
      description: data.extract || "No description available",
      image: data.thumbnail?.source || "https://via.placeholder.com/200"
    };
  } catch {
    return {
      description: "No data available",
      image: "https://via.placeholder.com/200"
    };
  }
}

// const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${place}`;

// const res = await fetch(url);
// const data = await res.json();

// console.log(data.thumbnail.source);


async function getNearbyPlaces(lat, lon, retryCount = 0) {
  const url = "https://overpass-api.de/api/interpreter";

  const query = `
    [out:json][timeout:25];
    (
      node["tourism"](around:12000, ${lat}, ${lon});
      node["amenity"="place_of_worship"](around:12000, ${lat}, ${lon});
      node["historic"](around:12000, ${lat}, ${lon});
    );
    out 25;
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      body: query
    });

    if (!res.ok) throw new Error("Rate limit");

    const data = await res.json();
    console.log(data.elements);
    return data.elements ;

  } catch (err) {
    if (retryCount < 2) {
      console.log("Retrying in 3 seconds...");
      await new Promise(res => setTimeout(res, 3000));
      return getNearbyPlaces(lat, lon, retryCount + 1);
    } else {
      console.error("Failed after retries");
      alert("Too many requests. Please try again later.");
      return [];
    }
  }
}

// const places = await getNearbyPlaces(coords.lat, coords.lon);
// console.log(places);

// places.forEach(async place => {
//   console.log(place.tags.name || "Unknown");
// });

