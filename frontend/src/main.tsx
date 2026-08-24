import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import PatientDashboard from './pages/dashboards/PatientDashboard'
import HospitalAdminDashboard from './pages/dashboards/HospitalAdminDashboard'
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard'
import HospitalProfile from './pages/HospitalProfile'
import MapView from './pages/MapView'
import HospitalComparison from './pages/HospitalComparison'
import Notifications from './pages/Notifications'
import Favorites from './pages/Favorites'
import Settings from './pages/Settings'
import AlertsPage from './pages/AlertsPage'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import { ThemeProvider } from './components/theme-provider'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<LandingPage />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="dashboard/patient" element={<PatientDashboard />} />
              <Route path="dashboard/hospital" element={<HospitalAdminDashboard />} />
              <Route path="dashboard/superadmin" element={<SuperAdminDashboard />} />
              <Route path="hospitals/:id" element={<HospitalProfile />} />
              <Route path="map" element={<MapView />} />
              <Route path="compare" element={<HospitalComparison />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
