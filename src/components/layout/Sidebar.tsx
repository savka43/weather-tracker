import { useState } from "react"
import { BarChart3, CloudSun, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react"
import { NavLink } from "react-router-dom"
import "./Sidebar.css"

const sidebarItems = [
    { to: "/", label: "Search", icon: Search },
    { to: "/forecast", label: "Main Forecast", icon: CloudSun },
    { to: "/comparison", label: "Forecast Comparison", icon: BarChart3 },
]

export function Sidebar () {
    const [isCollapsed, setIsCollapsed] = useState(false)

    const getSidebarItemClass = ({ isActive }: { isActive: boolean }) =>
        isActive ? "sidebar-item sidebar-item-active" : "sidebar-item"

    return (
        <aside className={isCollapsed ? "aside aside-collapsed" : "aside"}>
            <div className="sidebar-header">
                <span className="sidebar-title">Weather Analyzer</span>
                <button
                    className="hide-sidebar-button"
                    type="button"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    onClick={() => setIsCollapsed((current) => !current)}
                >
                    {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                </button>
            </div>
            <nav className="sidebar-nav">
                <ul className="sidebar-list">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon

                        return (
                            <li key={item.to}>
                                <NavLink to={item.to} className={getSidebarItemClass} title={item.label}>
                                    <Icon className="sidebar-item-icon" size={19} />
                                    <span className="sidebar-item-text">{item.label}</span>
                                </NavLink>
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </aside>
    )
}
