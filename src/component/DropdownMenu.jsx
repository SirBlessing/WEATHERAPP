import React from 'react';
import '../App.css'

function DropdownMenu({ unit, onUnitChange }) {
  return (
    <div className="dropdown">
      <div className="dropdown-section">
        <h4>Switch to Imperial</h4>
      </div>

      <div className="dropdown-section">
        <h4>Temperature</h4>
        <ul>
          {['Celsius', 'Fahrenheit', 'Kelvin'].map((temp) => (
            <li
              key={temp}
              className={unit.temp === temp ? 'active' : ''}
              onClick={() => onUnitChange('temp', temp)}
            >
              {temp}
            </li>
          ))}
        </ul>
      </div>

      <div className="dropdown-section">
        <h4>Wind Speed</h4>
        <ul>
          {['km/h', 'mph', 'm/s'].map((speed) => (
            <li
              key={speed}
              className={unit.wind === speed ? 'active' : ''}
              onClick={() => onUnitChange('wind', speed)}
            >
              {speed}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default DropdownMenu;
