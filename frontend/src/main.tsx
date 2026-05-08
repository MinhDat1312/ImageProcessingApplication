import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import { RootLayout } from './layouts/RootLayout.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { VerifyPage } from './pages/VerifyPage.tsx'
import { MyImagesPage } from './pages/MyImagesPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<RootLayout><LoginPage /></RootLayout>} />
          <Route path="/register" element={<RootLayout><RegisterPage /></RootLayout>} />
          <Route path="/verify" element={<RootLayout><VerifyPage /></RootLayout>} />
          <Route
            path="/"
            element={
              <RootLayout contentClassName="app-content">
                <ProtectedRoute><App /></ProtectedRoute>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
