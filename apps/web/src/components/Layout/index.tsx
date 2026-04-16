import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Sun, Moon, Home, CheckSquare, FileText, BarChart2, Video, ChevronRight, Menu, X } from 'lucide-react'
import styles from './Layout.module.css'

const SIDEBAR_ITEMS = [
  { to: '/todo', label: 'Todo', icon: CheckSquare },
  { to: '/note', label: 'Note', icon: FileText },
  { to: '/data-viz', label: 'DataViz', icon: BarChart2 },
  { to: '/youtube-summary', label: 'YouTube Summary', icon: Video },
]

export default function Layout() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '')
  }

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev)
  }

  function closeSidebar() {
    setSidebarOpen(false)
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <button
          className={styles.sidebarToggle}
          onClick={toggleSidebar}
          title="앱 메뉴 열기/닫기"
          aria-label="앱 메뉴 열기/닫기"
        >
          {sidebarOpen ? <X size={16} strokeWidth={2} /> : <Menu size={16} strokeWidth={2} />}
        </button>
        <span className={styles.logo}>Test Lab</span>
        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <Home size={14} strokeWidth={2} />
            Hub
          </NavLink>
        </nav>
        <button className={styles.themeBtn} onClick={toggleTheme} title="테마 전환">
          {theme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </button>
      </header>

      <div className={styles.body}>
        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div
            className={styles.overlay}
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar panel */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>앱 목록</span>
            <button
              className={styles.sidebarCloseBtn}
              onClick={closeSidebar}
              aria-label="사이드바 닫기"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
          <nav className={styles.sidebarNav}>
            {SIDEBAR_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`
                }
                onClick={closeSidebar}
              >
                <Icon size={15} strokeWidth={2} />
                <span>{label}</span>
                <ChevronRight size={13} strokeWidth={2} className={styles.sidebarChevron} />
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
