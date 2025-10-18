// src/components/WeatherDetails.js
import React from "react";
import '../App.css';

const WeatherDetails = ({ weatherData }) => {
  const dailyForecast = weatherData?.daily || [];

  return (
    <div className="weather-details-container">
      {/* Current Weather Stats */}
      <div className="current-stats">
        <div className="stat-box">
          <p>Feels Like</p>
          <h3>{weatherData?.feelsLike ?? "--"}°</h3>
        </div>
        <div className="stat-box">
          <p>Humidity</p>
          <h3>{weatherData?.humidity ?? "--"}%</h3>
        </div>
        <div className="stat-box">
          <p>Wind</p>
          <h3>{weatherData?.windSpeed ?? "--"} km/h</h3>
        </div>
        <div className="stat-box">
          <p>Precipitation</p>
          <h3>{weatherData?.precipitation ?? "0"} mm</h3>
        </div>
      </div>

      {/* Daily Forecast */}
      <div className="daily-forecast">
        <h4>Daily forecast</h4>
        <div className="forecast-scroll">
          {dailyForecast.length > 0 ? (
            dailyForecast.map((day, index) => (
              <div key={index} className="forecastcard">
                <p className="day">{day.day}</p>
                <img src={day.icon} alt={day.condition} />
                <p className="tem">
                  <span>{day.max}°</span> <span>{day.min}°</span>
                </p>
              </div>
            ))
          ) : (
            <p className="no-data">No forecast available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherDetails;
