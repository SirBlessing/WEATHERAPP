import React from 'react';
import '../App.css';
import { useState, useEffect } from 'react';
import WeatherDetails from "../component/WeatherDetails";
import iconrain from "../assets/images/iconrain.webp"
import iconsunny from "../assets/images/iconsunny.webp"
import iconpartlycloudy from "../assets/images/iconpartlycloudy.webp"
import iconstorm from "../assets/images/iconstorm.webp"
import iconsnow from "../assets/images/iconsnow.webp"
import iconfog from "../assets/images/iconfog.webp"

const weatherIcons = {
  0: iconsunny, 1: iconsunny,
  2: iconpartlycloudy, 3: iconpartlycloudy,
  45: iconfog, 48: iconfog,
  51: iconrain, 53: iconrain, 55: iconrain,
  61: iconrain, 63: iconrain, 65: iconrain,
  71: iconsnow, 73: iconsnow, 75: iconsnow,
  80: iconstorm, 81: iconstorm, 82: iconstorm,
  95: iconstorm,
};

const Home = () => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
 const [search, setSearch] = useState("");
  const [weather, setWeather] = useState(null);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
  

 // 🔍 Get coordinates from city name
  const fetchCoordinates = async (city) => {
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}`
      );
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        setError("City not found.");
        return null;
      }
      const { latitude, longitude, name, country } = data.results[0];
      return { latitude, longitude, name, country };
    } catch (err) {
      console.error(err);
      setError("Error fetching location.");
      return null;
    }
  };


   // 🌦️ Fetch weather using coordinates
  // 🌦️ Fetch weather & forecast
 const fetchWeather = async (lat, lon, name, country) => {
  try {
    setLoading(true);
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,relative_humidity_2m,weather_code&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto`
    );
    const data = await res.json();

    const c = data.current;
    const d = data.daily;
    const h = data.hourly;

    const current = {
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      precipitation: c.precipitation,
      windSpeed: c.wind_speed_10m,
      code: c.weather_code,
      time: c.time,
      city: name,
      country: country,
    };

    const forecast = d.time.map((day, i) => ({
      day: new Date(day).toLocaleDateString("en-US", { weekday: "short" }),
      icon: weatherIcons[d.weathercode[i]] || iconsunny,
      condition: d.weathercode[i],
      max: d.temperature_2m_max[i],
      min: d.temperature_2m_min[i],
    }));

    // 🕒 Convert hourly data to local time and filter 3PM–10PM (local)
const timezone = data.timezone;

const hourly = h.time.map((t, i) => {
  // Convert timestamp (which is in UTC) to local time for user's timezone
  const localTime = new Date(t + "Z").toLocaleString("en-US", {
    timeZone: timezone,
  });

  return {
    time: localTime,
    temp: h.temperature_2m[i],
    code: h.weather_code[i],
  };
});

const filteredHourly = hourly.filter((h) => {
  const hour = new Date(h.time).getHours();
  return hour >= 15 && hour <= 22; // local 3PM–10PM
});

    setWeather(current);
    setDailyForecast(forecast);
    setHourlyForecast(filteredHourly);
    setSelectedDay(forecast[0]?.day || "");
  } catch (err) {
    console.error(err);
    setError("Error fetching weather data.");
  } finally {
    setLoading(false);
  }
};


  

  // 🔘 Handle search click
  const handleSearch = async () => {
    if (!search.trim()) return;
    setError("");
    const coords = await fetchCoordinates(search);
    if (coords) {
      await fetchWeather(coords.latitude, coords.longitude, coords.name, coords.country);
    }
  };



 
// 🧭 Reverse geocoding: Convert coordinates to city/country name
const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`
    );
    const data = await res.json();
    if (data && data.results && data.results.length > 0) {
      const place = data.results[0];
      return {
        name: place.name || place.admin2 || place.admin1 || "Unknown",
        country: place.country || "",
      };
    } else {
      return { name: "Unknown", country: "" };
    }
  } catch (err) {
    console.error("Reverse geocode failed:", err);
    return { name: "Unknown", country: "" };
  }
};

// 📍 Auto detect user location on first load
useEffect(() => {
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // First fetch city name via reverse geocoding
          const { name, country } = await reverseGeocode(lat, lon);

          // Then fetch weather for that city
          await fetchWeather(lat, lon, name, country);
        },
        async (error) => {
          console.warn("Geolocation denied, falling back to Lagos:", error.message);
          setError("Location access denied. Showing Lagos instead.");
          const coords = await fetchCoordinates("Lagos");
          if (coords) {
            await fetchWeather(coords.latitude, coords.longitude, coords.name, coords.country);
          }
        }
      );
    } else {
      console.warn("Geolocation not supported, falling back to Lagos.");
      fetchCoordinates("Lagos").then((coords) => {
        if (coords) fetchWeather(coords.latitude, coords.longitude, coords.name, coords.country);
      });
    }
  };

  getUserLocation();
}, []);


 // Filter hourly forecast by selected day
  const filteredHours = hourlyForecast.filter(
    (h) =>
      new Date(h.time).toLocaleDateString("en-US", { weekday: "short" }) ===
      selectedDay
  
    );


     const hours = [
    { time: '3 PM', temp: '20°', icon: '☁️' },
    { time: '4 PM', temp: '20°', icon: '🌤️' },
    { time: '5 PM', temp: '20°', icon: '☀️' },
    { time: '6 PM', temp: '19°', icon: '☁️' },
    { time: '7 PM', temp: '18°', icon: '☁️' },
    { time: '8 PM', temp: '17°', icon: '🌙' },
    { time: '9 PM', temp: '17°', icon: '☁️' },
    { time: '10 PM', temp: '17°', icon: '☀️' },
  ];


const mockWeatherData = {
  feelsLike: 18,
  humidity: 46,
  windSpeed: 14,
  precipitation: 0,
  daily: [
    { day: "Tue", icon: iconrain, condition: "Rainy", max: 20, min: 14 },
    { day: "Wed", icon: iconrain, condition: "Cloudy", max: 21, min: 15 },
    { day: "Thu", icon: iconsunny, condition: "Sunny", max: 24, min: 14 },
    { day: "Fri", icon: iconpartlycloudy, condition: "Partly Cloudy", max: 25, min: 13 },
    { day: "Sat", icon: iconstorm, condition: "Storm", max: 21, min: 15 },
    { day: "Sun", icon: iconsnow, condition: "Cloudy", max: 25, min: 16 },
    { day: "Mon", icon: iconfog, condition: "Fog", max: 24, min: 15 },
  ],
};




// 🕒 Format hour to 12-hour AM/PM


const formatHour = (timeString) => {
  const date = new Date(timeString);
  let hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours} ${ampm}`;
};






    return (
        <div className='home'>
            <section className="headersec"> 
                <h1>How’s the sky looking today?</h1>
            </section>
            <section className='searchsec'>
                <input type="text" placeholder="Search for places..." 
              value={search}
          onChange={(e) => setSearch(e.target.value)}
                />
                <button onClick={handleSearch}>Search</button>
            </section>

         {/* Display location info from search * should not be here*/}
      {/* {error && <p className="error">{error}</p>}
      {location && (
        <div className="location-info">
          <h2>{location.name}, {location.country}</h2>
          <p>Latitude: {location.latitude}, Longitude: {location.longitude}</p>
        </div>
      )} */}
 {error && <p className="error">{error}</p>}


    <section className='mainweathersec'>
            <div className='sec1container'>
            <div className="weather-card">
      <div className="location">
        <h2> {weather?.city ? `${weather.city}, ${weather.country}` : "Search for a city"}</h2>
        <p>
           {weather?.time
                  ? new Date(weather.time).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
        </p>
      </div>

      <div className="temp-display">
        <div className="icon">
           {weather ? (
                  <img
                    src={weatherIcons[weather.code] || iconsunny}
                    alt="Weather icon"
                    style={{ width: "60px" }}
                  />
                ) : (
                  "☁️"
                )}
        </div>
        <h3 className="temp">
           {weather ? `${Math.round(weather.temp)}°` : "--°"}
        </h3>
        
      </div>

      </div>
        <div> 
          {/* <WeatherDetails weatherData={mockWeatherData} /> */}
           {/* Details Section */}
          {weather && (
            <WeatherDetails
              weatherData={{
                feelsLike: weather.temp,
                humidity: 46, // optional static for now
                windSpeed: weather.windSpeed,
                precipitation: 0,
                daily: dailyForecast,
              }}
            />
          )}
          </div>
    </div>
  {/* 🌤️ Hourly forecast scrollable list */}
        <div className="forecast">
          <div className="forcastdaysec">
            <h3>Hourly forecast</h3>
            <select
              name="selectday"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              {dailyForecast.map((d, i) => (
                <option key={i} value={d.day}>
                  {d.day}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p>Loading hourly data...</p>
          ) : (
            <ul className="hourly-scroll">
              {filteredHours.map((h, i) => (
                <li key={i}>
                  <span className="spantest">
                    <img
                      src={weatherIcons[h.code] || iconsunny}
                      alt="icon"
                      style={{ width: "30px" }}
                    />
                    <span>
                      {formatHour(h.time)}
                    </span>
                  </span>
                  <span>{Math.round(h.temp)}°</span>
                </li>
              ))}
            </ul>
          )}
        </div>
    </section>
        </div>
    );
};

export default Home;