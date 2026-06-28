import { Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import MainForecastPage from './pages/MainForecast'
import ForecastComparisonPage from './pages/ForecastComparisonPage'
import HistoryPage from './pages/HistoryPage'
import SearchPage from './pages/SearchPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

function App() {

  return (
    <div className="App">
      <Sidebar />
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/forecast" element={<MainForecastPage />} />
        <Route path="/comparison" element={<ForecastComparisonPage />} />
        <Route path="/accuracy" element={<MainForecastPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  )
}

export default App
