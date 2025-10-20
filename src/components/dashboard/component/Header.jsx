import { Bell, CalendarDays, Plus, Minus } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo2 from "../../../assets/logo2.png";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const Header = () => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const weekday = currentDate.toLocaleDateString("en-GB", { weekday: "long" });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedHour, setSelectedHour] = useState("08");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [notificationCount, setNotificationCount] = useState(0);

  // 🔊 Small alert sound for due reminders
  const playSound = () => {
    const audio = new Audio(
      "https://assets.mixkit.co/sfx/download/mixkit-bell-notification-933.wav"
    );
    audio.play();
  };

  // Load reminders from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("reminders")) || [];
    setReminders(saved);
  }, []);

  // Save reminders to localStorage
  useEffect(() => {
    localStorage.setItem("reminders", JSON.stringify(reminders));
    const pending = reminders.filter((r) => !r.notified).length;
    setNotificationCount(pending);
  }, [reminders]);

  // ⏰ Check for due reminders (every 1 minute)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let updatedReminders = [...reminders];
      updatedReminders.forEach((r) => {
        const reminderTime = new Date(r.dateTime);
        if (reminderTime <= now && !r.notified) {
          alert(`🔔 Reminder: ${r.title}\n\n${r.description}`);
          playSound(); // play sound
          r.notified = true; // mark as notified
        }
      });
      setReminders(updatedReminders);
    }, 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  // ➕ Add Reminder
  const handleAddReminder = (e) => {
    e.preventDefault();
    const timeString = `${selectedHour}:${selectedMinute}`;
    const newReminder = {
      id: Date.now(),
      title,
      description,
      dateTime: new Date(`${selectedDate.toDateString()} ${timeString}`),
      notified: false,
    };
    const updated = [...reminders, newReminder];
    setReminders(updated);
    setShowReminderForm(false);
    setTitle("");
    setDescription("");
  };

  // ➖ Remove Reminder
  const handleRemoveReminder = (id) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
  };

  // Highlight dates with reminders
  const datesWithReminders = reminders.map((r) =>
    new Date(r.dateTime).toDateString()
  );

  // Dropdown options
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  return (
    <header className="shadow-lg relative">
      <div className="flex items-center justify-between mx-4">
        {/* Logo */}
        <Link to="/">
          <div className="flex items-center">
            <img
              src={logo2}
              alt="Logo"
              className="w-[40%] h-[40%] object-cover ml-10 hover:scale-110 transition-transform"
            />
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center space-x-4 mr-5">
          {/* 🔔 Notification Button */}
          <div className="relative">
            <button
              className="rounded-xl bg-green-600 text-white px-1.5 py-1.5 relative"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowCalendar(false);
              }}
            >
              <Bell />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-1.5">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 bg-white shadow-xl rounded-xl w-80 p-4 z-50">
                <h2 className="text-lg font-semibold mb-2">Reminders</h2>
                {reminders.length === 0 ? (
                  <p className="text-gray-500 text-sm">No reminders yet</p>
                ) : (
                  <ul className="max-h-60 overflow-y-auto space-y-3">
                    {reminders.map((r) => (
                      <li
                        key={r.id}
                        className={`p-3 rounded-lg text-sm flex justify-between items-start ${
                          r.notified ? "bg-gray-100 text-gray-500" : "bg-green-50"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-green-700">
                            {r.title}
                          </p>
                          {r.description && (
                            <p className="text-gray-600 text-xs mt-1">
                              {r.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(r.dateTime).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveReminder(r.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                          title="Remove reminder"
                        >
                          <Minus size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* 📅 Calendar Button */}
          <div className="relative">
            <button
              className="rounded-xl bg-green-600 text-white px-1.5 py-1.5"
              onClick={() => {
                setShowCalendar(!showCalendar);
                setShowNotifications(false);
              }}
            >
              <CalendarDays />
            </button>

            {showCalendar && (
              <div className="absolute right-0 mt-2 bg-white shadow-xl rounded-xl w-[26rem] p-4 z-50">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">Calendar</h2>
                  <button
                    onClick={() => setShowReminderForm(!showReminderForm)}
                    className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileContent={({ date }) => {
                    const dateStr = date.toDateString();
                    if (datesWithReminders.includes(dateStr)) {
                      return (
                        <div className="w-full flex justify-center mt-1">
                          <div className="h-1 w-4 bg-green-600 rounded-full"></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Reminder Form */}
                {showReminderForm && (
                  <form onSubmit={handleAddReminder} className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Reminder Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 w-full"
                        placeholder="e.g., Inspect farm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 w-full"
                        placeholder="Enter details..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Time
                      </label>
                      <div className="flex space-x-2">
                        <select
                          value={selectedHour}
                          onChange={(e) => setSelectedHour(e.target.value)}
                          className="border border-gray-300 rounded-md p-2 w-1/2"
                        >
                          {hours.map((hr) => (
                            <option key={hr} value={hr}>
                              {hr}h
                            </option>
                          ))}
                        </select>
                        <select
                          value={selectedMinute}
                          onChange={(e) => setSelectedMinute(e.target.value)}
                          className="border border-gray-300 rounded-md p-2 w-1/2"
                        >
                          {minutes.map((min) => (
                            <option key={min} value={min}>
                              {min}m
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      Set Reminder
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* 🗓️ Date Display */}
          <div className="text-right">
            <h2 className="font-bold">{weekday}</h2>
            <h3 className="text-green-600">{formattedDate}</h3>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
