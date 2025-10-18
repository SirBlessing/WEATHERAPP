// import React from 'react';
// import logo from '../assets/images/logo.svg';
// const Navbar = () => {
//     return (
//         <>
//            <nav className='navbar'>
//             <div>
//                 <img src={logo} alt="" />
//                 <h2>Weather Now</h2>
//             </div>
//             <div>
//                 <select name="units" id="units">
//                     <option value="temp">temprature</option>
//                 </select>
//             </div>
//            </nav>
//         </>
//     );
// };

// export default Navbar;

import React, { useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import { FiChevronDown } from 'react-icons/fi';
import DropdownMenu from './DropdownMenu';
import '../App.css'
import logo from '../assets/images/logo.svg';

function Navbar({ unit, onUnitChange }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="logo">
        {/* <span className="icon">☀️</span> Weather Now */}
        <div><img src={logo} alt="logo" /> </div>
      </div>

      <div className="settings">
        <button className="settings-btn" onClick={() => setOpen(!open)}>
          <FiSettings size={13}  />
         
          <span>Units</span>
          <FiChevronDown/>
        </button>

        {open && <DropdownMenu unit={unit} onUnitChange={onUnitChange} />}
        
      </div>
      
    </nav>
  );
}

export default Navbar;
