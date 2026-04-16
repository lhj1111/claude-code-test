import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CheckSquare, FileText, BarChart2, Play,
  Database, Server, Globe, ArrowRight,
} from 'lucide-react'
import styles from './Home.module.css'

async function fetchCount(path: string): Promise<number> {
  const res = await fetch(path)
  const json = await res.json()
  return Array.isArray(json.data) ? json.data.length : 0
}

const TECH_TAGS = [
  { label: 'React 18', color: 'accent' },
  { label: 'Vite 5', color: 'accent' },
  { label: 'TypeScript', color: 'accent' },
  { label: 'TanStack Query', color: 'accent' },
  { label: 'Hono 4', color: 'blue' },
  { label: 'Prisma 5', color: 'blue' },
  { label: 'Zod', color: 'blue' },
  { label: 'PostgreSQL 16', color: 'green' },
  { label: 'Docker', color: 'green' },
  { label: 'pnpm', color: 'purple' },
]

const ARCH_NODES = [
  { icon: Globe, label: 'Web', port: ':5173' },
  { icon: Server, label: 'API', port: ':3000' },
  { icon: Database, label: 'DB', port: ':5434' },
]

export default function Home() {
  const { data: todoCount = 0 } = useQuery({ queryKey: ['todo-count'], queryFn: () => fetchCount('/api/todos') })
  const { data: noteCount = 0 } = useQuery({ queryKey: ['note-count'], queryFn: () => fetchCount('/api/notes') })
  const { data: summaryCount = 0 } = useQuery({ queryKey: ['summary-count'], queryFn: () => fetchCount('/api/summaries') })

  const topApps = [
    {
      to: '/todo',
      icon: CheckSquare,
      color: 'accent' as const,
      title: 'Todo',
      desc: '칸반 보드 · 우선순위 · 검색/필터',
      stat: { value: todoCount, label: 'items' },
    },
    {
      to: '/note',
      icon: FileText,
      color: 'blue' as const,
      title: 'Note',
      desc: '자동저장 · 태그 · 핀 · 정렬',
      stat: { value: noteCount, label: 'notes' },
    },
    {
      to: '/data-viz',
      icon: BarChart2,
      color: 'green' as const,
      title: 'Data Visualizer',
      desc: 'CSV 업로드 · 5종 차트 · 통계',
      stat: null,
    },
  ]

  const wideApp = {
    to: '/youtube-summary',
    icon: Play,
    color: 'purple' as const,
    title: 'YouTube Summary',
    desc: 'AI 요약 · 카테고리 · 검색 · 메모',
    stat: { value: summaryCount, label: 'saved' },
  }

  return (
    <div className={styles.page}>

      {/* ── Lab Header ── */}
      <div className={styles.lab}>
        <h1 className={styles.labTitle}>Test Lab</h1>
        <p className={styles.labSubtitle}>풀스택 실험실 — React · Hono · PostgreSQL</p>
      </div>

      {/* ── App Grid ── */}
      <div className={styles.appGrid}>
        {/* Top row: 3 equal cards */}
        <div className={styles.topRow}>
          {topApps.map((app) => {
            const Icon = app.icon
            return (
              <Link
                key={app.to}
                to={app.to}
                className={`${styles.card} ${styles[`card_${app.color}`]}`}
              >
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles[`icon_${app.color}`]}`}>
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <span className={styles.cardTitle}>{app.title}</span>
                </div>
                <p className={styles.cardDesc}>{app.desc}</p>
                <div className={styles.cardFooter}>
                  {app.stat ? (
                    <div className={styles.cardStat}>
                      <span className={styles.cardStatNum}>{app.stat.value}</span>
                      <span className={styles.cardStatLabel}>{app.stat.label}</span>
                    </div>
                  ) : (
                    <div />
                  )}
                  <span className={styles.cardArrow}><ArrowRight size={14} /></span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Bottom row: 1 wide card */}
        {(() => {
          const Icon = wideApp.icon
          return (
            <Link
              to={wideApp.to}
              className={`${styles.card} ${styles.cardWide} ${styles[`card_${wideApp.color}`]}`}
            >
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${styles[`icon_${wideApp.color}`]}`}>
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <span className={styles.cardTitle}>{wideApp.title}</span>
              </div>
              <p className={styles.cardDesc}>{wideApp.desc}</p>
              <div className={styles.cardFooter}>
                {wideApp.stat ? (
                  <div className={styles.cardStat}>
                    <span className={styles.cardStatNum}>{wideApp.stat.value}</span>
                    <span className={styles.cardStatLabel}>{wideApp.stat.label}</span>
                  </div>
                ) : (
                  <div />
                )}
                <span className={styles.cardArrow}><ArrowRight size={14} /></span>
              </div>
            </Link>
          )
        })()}
      </div>

      {/* ── System Info ── */}
      <div className={styles.systemInfo}>
        <div className={styles.techTags}>
          {TECH_TAGS.map(({ label, color }) => (
            <span key={label} className={`${styles.techPill} ${styles[`pill_${color}`]}`}>
              {label}
            </span>
          ))}
        </div>
        <div className={styles.archStrip}>
          {ARCH_NODES.map(({ icon: NodeIcon, label, port }, i) => (
            <span key={label} className={styles.archNode}>
              {i > 0 && <span className={styles.archConnector}>►</span>}
              <NodeIcon size={12} />
              <span className={styles.archNodeLabel}>{label}</span>
              <span className={styles.archNodePort}>{port}</span>
            </span>
          ))}
        </div>
      </div>

    </div>
  )
}
