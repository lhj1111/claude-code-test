import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Sun, Moon, CheckSquare, FileText, BarChart2, Home } from 'lucide-react'
import styles from './Layout.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Hub', icon: Home, end: true },
  { to: '/todo', label: 'Todo', icon: CheckSquare },
  { to: '/note', label: 'Note', icon: FileText },
  { to: '/data-viz', label: 'DataViz', icon: BarChart2 },
]

export default function Layout() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  )

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '')
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.logo}>⚡ Test Lab</span>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button className={styles.themeBtn} onClick={toggleTheme} title="테마 전환">
          {theme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </button>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
