import { Bell, CalendarDays, Search } from 'lucide-react';
import React from 'react';
import logo from '../../../assets/logo2.png';

const Header = () => {
  const currentDate = new Date();

  const formattedDate = currentDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const weekday = currentDate.toLocaleDateString('en-GB', {
    weekday: 'long',
  });

  return (
    <header className="shadow-lg">
      <div className="flex items-center justify-between mx-4 ">
       
        <img src={logo} alt="Castorcare Logo" className="h-22" />

        {/* <form className="flex items-center">
          <input
            type="text"
            placeholder="Search your dashboard here..."
            className="rounded shadow-lg w-[40vw] px-3 py-2"
          />
          <button
            className="shadow-lg rounded px-2 py-2 flex items-center bg-green-600"
            type="submit"
          >
            <Search className="text-white" />
          </button>
        </form> */}

        <div className="flex items-center space-x-4 mr-5">
        <div className="space-x-3">
          <button className="rounded-xl bg-green-600 text-white px-1.5 py-1.5">
            <Bell />
          </button>
          <button className="rounded-xl bg-green-600 text-white px-1.5 py-1.5">
            <CalendarDays />
          </button>
        </div>

        <div>
          <span >
            <h2 className="font-bold">{weekday}</h2>
            <h3 className="text-green-600">{formattedDate}</h3>
          </span>
        </div>
      </div>
      </div>
    </header>
  );
};

export default Header;
