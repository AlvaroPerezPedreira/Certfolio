import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })),
)
const PublicLandingPage = lazy(() =>
  import('./pages/PublicLandingPage').then((module) => ({
    default: module.PublicLandingPage,
  })),
)

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<PublicLandingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
