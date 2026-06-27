import SearchImage from '../assets/search-weather.svg'
import './SearchPage.css'

export default function SearchPage() {
    return (
        <main>
            <div className="container">
                <img className="search-image" src={SearchImage} alt="" />
                <h1>Discover the Weather</h1>
                <p>Enter a city name to get AI-powered weather analysys, multi-source forecasts, and accuracy insights.</p>
                <div className="input-field-container">
                    <input type="text" name="" id="" className="input-field" placeholder="Enter a city name..." />
                    <button className="search-button">Analyze Weather</button>
                </div>
            </div>
        </main>
    )
}
