import React from 'react';
import { Menu, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { Link } from 'react-router-dom';

export const Navbar = ({ onToggleMobileSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Garage Portal
            </span>
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-3">
          {/* Notification dropdown */}
          <NotificationDropdown />

          <div className="h-6 w-px bg-slate-200 mx-1" />

          {/* Profile link */}
          <Link
            to="/profile"
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
              {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-none">{user?.full_name || user?.email}</p>
              <p className="text-[10px] text-slate-400 capitalize mt-0.5">{user?.role?.toLowerCase()}</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
