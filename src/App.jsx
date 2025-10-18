import { useState } from 'react'
import Home from './pages/Home'
import './App.css'
import Navbar from './component/Navbar'
// import WeatherCard from './component/WeatherCard';
// import Forecast from './component/Forecast';
function App() {
    const [unit, setUnit] = useState({
    temp: 'Celsius',
    wind: 'km/h',
    system: 'Metric'
  });

  const handleUnitChange = (type, value) => {
    setUnit((prev) => ({ ...prev, [type]: value }));
  };

  return (
    <>
   
     <div className='app'>
       <Navbar unit={unit} onUnitChange={handleUnitChange}/>
     <Home/>
     </div>
    
    </>
  )
}

export default App
