
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { Toaster } from './components/ui/sonner'
import './index.css'

// Pages
import Dashboard from './pages/Dashboard'
import LandingPage from './pages/LandingPage'
import Auth from './pages/Auth'
import Settings from './pages/Settings'
import About from './pages/About'
import NotFound from './pages/NotFound'
import Calendar from './pages/Calendar'
import SubscriptionPage from './pages/Subscription'
import AcceptInvite from './pages/AcceptInvite'
import viteSpaPlugin from './vite-spa-plugin'

// Install SPA plugin
viteSpaPlugin();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
