import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

import useAuth from './hooks/useAuth.js';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Auth pages
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

// Student pages
import EventList from './pages/student/EventList.jsx';
import EventDetail from './pages/student/EventDetail.jsx';
import Dashboard from './pages/student/Dashboard.jsx';

// Organizer pages
import ManageEvents from './pages/organizer/ManageEvents.jsx';
import CreateEvent from './pages/organizer/CreateEvent.jsx';
import EditEvent from './pages/organizer/EditEvent.jsx';
import CheckIn from './pages/organizer/CheckIn.jsx';
import OrganizerRegistrants from './pages/organizer/OrganizerRegistrants.jsx';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';

const AppRoutes = () => {
  const { hydrate } = useAuth();

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<EventList />} />
        <Route path="/events/:id" element={<EventDetail />} />

        {/* Student */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Organizer */}
        <Route
          path="/organizer/manage"
          element={
            <ProtectedRoute allowedRoles={['organizer', 'admin']}>
              <ManageEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/create"
          element={
            <ProtectedRoute allowedRoles={['organizer', 'admin']}>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['organizer', 'admin']}>
              <EditEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/checkin/:eventId"
          element={
            <ProtectedRoute allowedRoles={['organizer', 'admin']}>
              <CheckIn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/manage/:eventId"
          element={
            <ProtectedRoute allowedRoles={['organizer', 'admin']}>
              <OrganizerRegistrants />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />

        {/* Fallbacks */}
        <Route
          path="/unauthorized"
          element={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="text-5xl">🔒</div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Access Denied</h1>
              <p className="text-gray-500 dark:text-gray-400">You don't have permission to view this page.</p>
            </div>
          }
        />
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="text-5xl">🌐</div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">404 — Page Not Found</h1>
            </div>
          }
        />
      </Routes>
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    <AppRoutes />
  </BrowserRouter>
);

export default App;
