import { Route, Routes } from 'react-router-dom';
import { isConfigured } from './lib/supabase.js';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SetupNotice from './components/SetupNotice.jsx';
import HomePage from './pages/HomePage.jsx';
import ExhibitsPage from './pages/ExhibitsPage.jsx';
import ExhibitDetailPage from './pages/ExhibitDetailPage.jsx';
import TeachersPage from './pages/TeachersPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import EventDetailPage from './pages/EventDetailPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import CreatorsPage from './pages/CreatorsPage.jsx';
import CreatorDetailPage from './pages/CreatorDetailPage.jsx';
import TimeMachinePage from './pages/TimeMachinePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ExhibitFormPage from './pages/ExhibitFormPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  if (!isConfigured) return <SetupNotice />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="exhibits" element={<ExhibitsPage />} />
        <Route path="exhibits/:id" element={<ExhibitDetailPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="creators" element={<CreatorsPage />} />
        <Route path="creators/:id" element={<CreatorDetailPage />} />
        <Route path="time-machine" element={<TimeMachinePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dashboard/new" element={<ExhibitFormPage />} />
          <Route path="dashboard/:id/edit" element={<ExhibitFormPage />} />
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
