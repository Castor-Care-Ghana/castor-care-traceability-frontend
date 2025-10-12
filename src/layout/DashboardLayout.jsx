import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/dashboard/component/Header";
import Sidebar from "../components/dashboard/component/Sidebar";

const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };
  return (
    <div className="flex flex-col h-screen bg-gray-100 bg-opacity-50">
      <Header onToggle={toggleSidebar} />
       <div className="flex flex-1 overflow-hidden">
        <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
