import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import HomePage from './pages/HomePage.tsx'
import ExplorePage from './pages/ExplorePage.tsx'
import ChatPage from './pages/ChatPage.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ImagesProvider } from './context/ImagesContext.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import { AdminProtectedRoute } from './components/AdminProtectedRoute.tsx'
import { RootLayout } from './layouts/RootLayout.tsx'
import { AuthLayout } from './layouts/AuthLayout.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { VerifyPage } from './pages/VerifyPage.tsx'
import { MyImagesPage } from './pages/MyImagesPage.tsx'
import { AdminPage } from './pages/AdminPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ImagesProvider>
          <Routes>
            <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
            <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
            <Route path="/verify" element={<RootLayout><VerifyPage /></RootLayout>} />
            <Route
              path="/"
              element={
                <RootLayout contentClassName="home-page">
                  <HomePage />
                </RootLayout>
              }
            />
            <Route
              path="/explore"
              element={
                <RootLayout contentClassName="explore-page">
                  <ExplorePage />
                </RootLayout>
              }
            />
            <Route
              path="/chat"
              element={
                <RootLayout contentClassName="chat-page">
                  <ChatPage />
                </RootLayout>
              }
            />
            <Route
              path="/studio"
              element={
                <RootLayout contentClassName="studio-page">
                  <App />
                </RootLayout>
              }
            />
            <Route
              path="/my-images"
              element={
                <RootLayout contentClassName="my-images-page">
                  <ProtectedRoute><MyImagesPage /></ProtectedRoute>
                </RootLayout>
              }
            />
            <Route
              path="/admin"
              element={
                <RootLayout contentClassName="admin-page">
                  <AdminProtectedRoute><AdminPage /></AdminProtectedRoute>
                </RootLayout>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ImagesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
