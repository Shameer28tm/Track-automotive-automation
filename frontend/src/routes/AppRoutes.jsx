import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// App Pages
import DashboardPage from '../pages/dashboard/DashboardPage';
import VehiclesPage from '../pages/vehicles/VehiclesPage';
import AppointmentsPage from '../pages/appointments/AppointmentsPage';
import RepairJobsPage from '../pages/services/RepairJobsPage';
import FaultsPage from '../pages/faults/FaultsPage';
import CustomersPage from '../pages/customers/CustomersPage';
import StaffPage from '../pages/staff/StaffPage';
import ProfilePage from '../pages/profile/ProfilePage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated Application Routes under DashboardLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="services" element={<RepairJobsPage />} />
        <Route path="faults" element={<FaultsPage />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* Admin-only Routes */}
        <Route
          path="customers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CustomersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <StaffPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
