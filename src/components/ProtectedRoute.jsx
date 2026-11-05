import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading, Message } from './States.jsx';

// Энэ нь зөвхөн UX: бодит хамгаалалтыг өгөгдлийн сангийн RLS хийдэг.
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (adminOnly && !isAdmin) {
    return (
      <div className="page">
        <Message title="Хандах эрхгүй">Энэ хэсэг зөвхөн администраторт нээлттэй.</Message>
      </div>
    );
  }
  return <Outlet />;
}
