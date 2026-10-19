import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  Wrench,
  AlertCircle,
  Users,
  UserCheck,
  ShieldAlert,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, isAdmin, isMechanic, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Vehicles', to: '/vehicles', icon: Car },
    { label: 'Appointments', to: '/appointments', icon: CalendarCheck },
    { label: 'Repair & Services', to: '/services', icon: Wrench },
    { label: 'Vehicle Faults', to: '/faults', icon: AlertCircle },
  ];

  if (isAdmin) {
    navItems.push(
      { label: 'Customers', to: '/customers', icon: Users },
      { label: 'Mechanics & Staff', to: '/staff', icon: UserCheck }
    );
  }

  const roleBadgeStyle = {
    ADMIN: 'bg-purple-900/60 text-purple-300 border-purple-700/50',
    MECHANIC: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
    CUSTOMER: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
  }[user?.role || 'CUSTOMER'];

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 border-r border-slate-800">
      {/* Brand header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-base">TRACK AUTOMOTIVE</h1>
            <p className="text-[11px] text-slate-400 font-mono tracking-wider">GARAGE AUTOMATION</p>
          </div>
        </div>
      </div>

      {/* User Mini Profile */}
      <div className="p-4 mx-4 mt-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
            {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name || user?.email}</p>
            <span className={`inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border mt-1 ${roleBadgeStyle}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav list */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileOpen?.(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer log out */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30">
        <NavContent />
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 z-50">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
