const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const locBtn = document.getElementById("locBtn");
const range = document.getElementById("range");
const rangeValue = document.getElementById("rangeValue");

// Update slider value
if(rangeValue.textContent === "") {
  rangeValue.textContent = range.value/1000;
}
range.addEventListener("input", () => {
  rangeValue.textContent = (range.value)/1000;
});

// Search button
searchBtn.addEventListener("click", async () => {
  const city = searchInput.value.trim();
  if (!city) return alert("Enter a location");

  const coords = await getCoordinates(city);
  if (!coords) return alert("Location not found");

  goToResult(coords.lat, coords.lon);
});

// Use my location
locBtn.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      goToResult(lat, lon);
    },
    () => {
      alert("Please allow location access");
    }
  );
});

async function getCoordinates(place) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${place}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.length === 0) return null;

  return {
    lat: data[0].lat,
    lon: data[0].lon
  };
}
function goToResult(lat, lon) {
  const radius = range.value;

  window.location.href = `result.html?lat=${lat}&lon=${lon}&radius=${radius}`;
}


