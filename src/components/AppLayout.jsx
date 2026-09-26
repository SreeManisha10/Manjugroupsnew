import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp'
import logo from '../assets/download.webp'

const employeeLinks = [
  { to: '/dashboard', label: 'Overview', icon: '⌂' },
  { to: '/properties', label: 'Properties', icon: '▦' },
  { to: '/leads', label: 'Leads', icon: '◎' },
]
const adminLinks = [...employeeLinks, { to: '/bookings', label: 'Bookings', icon: '◫' }]

function AppLayout({ children }) {
  const { account, workspace, leads, signOut } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const links = account?.role === 'admin' ? adminLinks : employeeLinks
  const activeLeadCount = leads.filter((lead) => !['Booked', 'Not Interested'].includes(lead.stage)).length
  const pageName = location.pathname === '/properties' ? 'Properties' : location.pathname === '/leads' ? 'Leads' : location.pathname === '/bookings' ? 'Bookings' : 'Overview'
  const logout = () => { signOut(); navigate('/login') }

  useEffect(() => {
    if (!sidebarOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [sidebarOpen])

  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
    <aside className="sidebar">
      <div className="brand"><img className="brand-logo" src={logo} alt="Manju Groups" /><button type="button" className="sidebar-toggle" onClick={() => setSidebarCollapsed((current) => !current)} aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{sidebarCollapsed ? '→' : '←'}</button><button type="button" className="sidebar-mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">×</button></div>
      <div className="workspace-chip"><span className="avatar avatar-teal">{account?.name?.slice(0, 2).toUpperCase()}</span><div><strong>{workspace?.name}</strong><small>{account?.role === 'admin' ? 'Admin control room' : workspace?.location}</small></div></div>
      <nav className="side-nav" aria-label="Main navigation">
        <span className="nav-label">Workspace</span>
        {links.map((link) => <NavLink key={link.to} to={link.to} title={link.label} aria-label={link.label} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon" aria-hidden="true">{link.icon}</span><span className="nav-link-label">{link.label}</span></NavLink>)}
      </nav>
      <div className="sidebar-footer">
        {!sidebarCollapsed && <Link className="sidebar-workspace-promo" to="/leads" onClick={() => setSidebarOpen(false)}>
          <span className="sidebar-promo-heading"><span className="sidebar-promo-icon" aria-hidden="true">↗</span><span className="eyebrow">SALES DESK / ACTIVE</span></span>
          <strong>Keep every buyer moving.</strong>
          <span className="sidebar-promo-count">{activeLeadCount} active conversations in the pipeline</span>
          <span className="sidebar-promo-action">Open lead desk <b>→</b></span>
        </Link>}
        <div className="user-card"><span className="avatar avatar-coral">{account?.name?.slice(0, 2).toUpperCase()}</span><div><strong>{account?.name}</strong><small>{account?.email}</small></div><button type="button" className="logout-button" onClick={logout} aria-label="Log out">↗</button></div>
      </div>
    </aside>
    <button type="button" className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" tabIndex={sidebarOpen ? 0 : -1} />
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb"><button type="button" className="mobile-sidebar-toggle" onClick={() => setSidebarOpen((current) => !current)} aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}>☰</button><span>Workspace</span><b>/</b><strong>{pageName}</strong></div></header>
      {children}
    </main>
  </div>
}

export default AppLayout
