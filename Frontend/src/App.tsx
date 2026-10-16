import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public pages
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import Technology from './pages/Technology';
import ExplainableAI from './pages/ExplainableAI';
import Impact from './pages/Impact';
import About from './pages/About';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/auth/Unauthorized';
import Pending from './pages/auth/Pending';
import SessionExpired from './pages/auth/SessionExpired';
import GoogleAuthSuccess from './pages/auth/GoogleAuthSuccess';

// Route guards
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Role Dashboards
import PatientDashboard from './pages/dashboards/PatientDashboard';
import HealthcareWorkerDashboard from './pages/dashboards/HealthcareWorkerDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Public layout with marketing Navbar and Footer
function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
      <Navbar />
      <div className="flex-1 w-full overflow-x-hidden">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public marketing website */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/technology" element={<Technology />} />
            <Route path="/explainable-ai" element={<ExplainableAI />} />
            <Route path="/impact" element={<Impact />} />
            <Route path="/about" element={<About />} />
          </Route>

          {/* Authentication flow */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending" element={<Pending />} />
          <Route path="/session-expired" element={<SessionExpired />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

          {/* Patient role routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/patient/dashboard" element={<Navigate to="/patient" replace />} />

          {/* Healthcare Worker role routes */}
          <Route
            path="/healthcare-worker"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['healthcare_worker']}>
                  <HealthcareWorkerDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/healthcare-worker/dashboard" element={<Navigate to="/healthcare-worker" replace />} />

          {/* Doctor role routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/doctor/dashboard" element={<Navigate to="/doctor" replace />} />

          {/* Admin role routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
