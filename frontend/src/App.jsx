import { lazy, Suspense } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from './components/common/ProtectedRoute';
import { LoadingSpinner, EmptyState } from './components/common/UI';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
const Home = lazy(() => import('./pages/public/Home'));
const Properties = lazy(() => import('./pages/public/Properties'));
const PropertyDetails = lazy(() => import('./pages/public/PropertyDetails'));
const MapPage = lazy(() => import('./pages/public/MapPage'));
const AuthPage = lazy(() => import('./pages/public/AuthPage'));
const RenterDashboard = lazy(() => import('./pages/renter/Dashboard'));
const OwnerDashboard = lazy(() => import('./pages/owner/Dashboard'));
const Favorites = lazy(() => import('./pages/renter/Favorites'));
const OwnerProperties = lazy(() => import('./pages/owner/Properties'));
const PropertyForm = lazy(() => import('./pages/owner/PropertyForm'));
const ProfilePage = lazy(() => import('./components/forms/ProfilePage'));
const BookingsPage = lazy(() => import('./components/booking/BookingsPage'));
const MessagesPage = lazy(() => import('./components/messaging/MessagesPage'));
const OwnerReviews = lazy(() => import('./pages/owner/Reviews'));
const NotificationsPage = lazy(() => import('./components/common/NotificationsPage'));
export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="properties" element={<Properties />} />
          <Route path="properties/:id" element={<PropertyDetails />} />
          <Route path="map" element={<MapPage />} />
          <Route path="login" element={<AuthPage key="login" mode="login" />} />
          <Route path="register" element={<AuthPage key="register" mode="register" />} />
          <Route path="forgot-password" element={<AuthPage key="forgot" mode="forgot" />} />
          <Route path="reset-password" element={<AuthPage key="reset" mode="reset" />} />
          <Route
            path="unauthorized"
            element={
              <EmptyState
                title="This space belongs to another role"
                description="Sign in with the appropriate renter or owner account to continue."
                action={
                  <Link className="btn" to="/">
                    Back to home
                  </Link>
                }
              />
            }
          />
          <Route
            path="*"
            element={
              <EmptyState
                title="404 — This place is off the map"
                description="The page you’re looking for has moved, or doesn’t exist."
                action={
                  <Link className="btn" to="/">
                    Find your way home
                  </Link>
                }
              />
            }
          />
        </Route>
        <Route element={<ProtectedRoute />}>
          {['renter', 'owner'].map((role) => (
            <Route key={role} element={<RoleRoute role={role} />}>
              <Route path={role} element={<DashboardLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route
                  path="dashboard"
                  element={role === 'renter' ? <RenterDashboard /> : <OwnerDashboard />}
                />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                {role === 'renter' ? (
                  <Route path="favorites" element={<Favorites />} />
                ) : (
                  <>
                    <Route path="properties" element={<OwnerProperties />} />
                    <Route path="properties/new" element={<PropertyForm key="new" />} />
                    <Route path="properties/:id/edit" element={<PropertyForm />} />
                    <Route path="reviews" element={<OwnerReviews />} />
                  </>
                )}
              </Route>
            </Route>
          ))}
        </Route>
      </Routes>
    </Suspense>
  );
}
