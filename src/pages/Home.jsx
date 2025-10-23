import React, { useState, useEffect } from 'react';
import '../App.css';
import WeatherDetails from "../component/WeatherDetails";

import iconrain from "../assets/images/iconrain.webp";
import iconsunny from "../assets/images/iconsunny.webp";
import iconpartlycloudy from "../assets/images/iconpartlycloudy.webp";
import iconstorm from "../assets/images/iconstorm.webp";
import iconsnow from "../assets/images/iconsnow.webp";
import iconfog from "../assets/images/iconfog.webp";

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
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [weather, setWeather] = useState(null);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");

  // 🌡️ Unit system
  const [unit, setUnit] = useState({
    temp: "Celsius",
    wind: "km/h",
  });

  // 🔁 Mapping to Open-Meteo parameters
  const unitParams = {
    Celsius: "celsius",
    Fahrenheit: "fahrenheit",
    Kelvin: "kelvin",
    "km/h": "kmh",
    mph: "mph",
    "m/s": "ms",
  };

  // 🧭 Convert city → coordinates
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

  // 🌦️ Fetch weather data
  const fetchWeather = async (lat, lon, name, country, unitOverride = unit) => {
    try {
      setLoading(true);

      const tempUnit = unitParams[unitOverride.temp] || "celsius";
      const windUnit = unitParams[unitOverride.wind] || "kmh";

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,relative_humidity_2m,weather_code&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto`
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
        latitude: lat,
        longitude: lon,
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
        return hour >= 15 && hour <= 22;
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

  // 🧭 Reverse geocode
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

  // 📍 Auto detect user location
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const { name, country } = await reverseGeocode(lat, lon);
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

  // 🔍 Search handler
  const handleSearch = async () => {
    if (!search.trim()) return;
    setError("");
    const coords = await fetchCoordinates(search);
    if (coords) {
      await fetchWeather(coords.latitude, coords.longitude, coords.name, coords.country);
    }
  };

  // 🌡️ Handle unit change and refetch
  const handleUnitChange = async (type, value) => {
    setUnit((prev) => {
      const newUnits = { ...prev, [type]: value };
      if (weather && weather.latitude && weather.longitude) {
        fetchWeather(
          weather.latitude,
          weather.longitude,
          weather.city,
          weather.country,
          newUnits
        );
      }
      return newUnits;
    });
  };

  const formatHour = (timeString) => {
    const date = new Date(timeString);
    let hours = date.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours} ${ampm}`;
  };

  const filteredHours = hourlyForecast.filter(
    (h) =>
      new Date(h.time).toLocaleDateString("en-US", { weekday: "short" }) ===
      selectedDay
  );

  return (
    <div className="home">
      <section className="headersec">
        <h1>How’s the sky looking today?</h1>
      </section>

      <section className="searchsec">
        <input
          type="text"
          placeholder="Search for places..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="mainweathersec">
        <div className="sec1container">
          <div className="weather-card">
            <div className="location">
              <h2>{weather?.city ? `${weather.city}, ${weather.country}` : "Search for a city"}</h2>
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
              <h3 className="temp">{weather ? `${Math.round(weather.temp)}°` : "--°"}</h3>
            </div>
          </div>

          {weather && (
            <WeatherDetails
              weatherData={{
                feelsLike: weather.feelsLike,
                humidity: weather.humidity,
                windSpeed: weather.windSpeed,
                precipitation: weather.precipitation,
                daily: dailyForecast,
              }}
            />
          )}
        </div>

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
                    <span>{formatHour(h.time)}</span>
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
