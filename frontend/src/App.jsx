import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LandingPage from './pages/LandingPage'
import ArabicDashboard from './pages/ar/Dashboard'
import EnglishDashboard from './pages/en/Dashboard'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/ar" element={<ArabicDashboard />} />
          <Route path="/en" element={<EnglishDashboard />} />
        </Routes>
        <Toaster position="top-center" />
      </div>
    </Router>
  )
}

export default App
