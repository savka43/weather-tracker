import { NavLink } from "react-router-dom"
import "./Sidebar.css"


export function Sidebar () {
    const getSidebarItemClass = ({ isActive }: { isActive: boolean }) =>
        isActive ? "sidebar-item sidebar-item-active" : "sidebar-item"

    return (
        <aside className="aside">
            <div className="sidebar-header">
                <span>Weather Analyzer</span>
                <button className="hide-sidebar-button">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        >
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M9 4v16" />
                        <path d="m15 12-3-3" />
                        <path d="m15 12-3 3" />
                        </svg>
                </button>
            </div>
            <nav className="sidebar-nav">
                <ul className="sidebar-list">
                <li><NavLink to="/" className={getSidebarItemClass}>Search</NavLink></li>
                <li><NavLink to="/comparison" className={getSidebarItemClass}>Forecast Comparison</NavLink></li>
                <li><NavLink to="/accuracy" className={getSidebarItemClass}>Forecast Accuracy</NavLink></li>
                <li><NavLink to="/history" className={getSidebarItemClass}>History</NavLink></li>
                <li><NavLink to="/settings" className={getSidebarItemClass}>Settings</NavLink></li>
                </ul>
            </nav>
        </aside>
    )
}
