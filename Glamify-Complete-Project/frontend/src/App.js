import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SalonList from './pages/SalonList';
import SalonDetail from './pages/SalonDetail';
import BookingHistory from './pages/BookingHistory';
import SalonOwnerDashboard from './pages/SalonOwnerDashboard';
import CreateSalon from './pages/CreateSalon';
import SalonBookings from './pages/SalonBookings';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const OwnerRoute = ({ children }) => {
  const { user } = useAuth();
  return user && user.role === 'SALON_OWNER' ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/salons" element={<SalonList />} />
            <Route path="/salons/:id" element={<SalonDetail />} />
            <Route
              path="/bookings"
              element={
                <PrivateRoute>
                  <BookingHistory />
                </PrivateRoute>
              }
            />
            <Route
              path="/owner/dashboard"
              element={
                <OwnerRoute>
                  <SalonOwnerDashboard />
                </OwnerRoute>
              }
            />
            <Route
              path="/owner/create-salon"
              element={
                <OwnerRoute>
                  <CreateSalon />
                </OwnerRoute>
              }
            />
            <Route
              path="/owner/salon/:salonId/bookings"
              element={
                <OwnerRoute>
                  <SalonBookings />
                </OwnerRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

