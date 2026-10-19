import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import ChatWidget from '../components/chatbot/ChatWidget';

export const DashboardLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Navbar onToggleMobileSidebar={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Global floating AI chatbot advisor */}
        <ChatWidget />
      </div>
    </div>
  );
};

export default DashboardLayout;
