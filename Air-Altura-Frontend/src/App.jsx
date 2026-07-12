import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import ScrollToTop from './components/ScrollToTop';
import SearchPage from './pages/SearchPage';
import ResultsPage from './pages/ResultsPage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import BookingsPage from './pages/BookingsPage';
import FlightDetailPage from './pages/FlightDetailPage';
import AuthPage from './pages/AuthPage';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/auth" replace />;
}

function AppShell() {
  return (
    <div className="min-h-screen bg-aa-cream">
      <ScrollToTop />
      <Header />
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/',          element: <SearchPage /> },
      { path: '/results',   element: <ResultsPage /> },
      { path: '/flight/:id', element: <FlightDetailPage /> },
      { path: '/booking',   element: <BookingPage /> },
      { path: '/payment',   element: <PaymentPage /> },
      { path: '/bookings',  element: <ProtectedRoute><BookingsPage /></ProtectedRoute> },
      { path: '/auth',      element: <AuthPage /> },
      { path: '*',          element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
