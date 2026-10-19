import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import MechanicDashboard from './MechanicDashboard';
import CustomerDashboard from './CustomerDashboard';

export const DashboardPage = () => {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  } else if (user?.role === 'MECHANIC') {
    return <MechanicDashboard />;
  } else {
    return <CustomerDashboard />;
  }
};

export default DashboardPage;
