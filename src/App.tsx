import { Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import MainForecastPage from './pages/MainForecast'
import ForecastComparisonPage from './pages/ForecastComparisonPage'
import SearchPage from './pages/SearchPage'
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
      </Routes>
    </div>
  )
}

export default App
