import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import {
  CheckSquare, FileText, BarChart2, Play,
  Database, Server, Globe, Package, Layers, Code2,
  Activity, GitBranch, Cpu,
} from 'lucide-react'
import styles from './Home.module.css'

ChartJS.register(ArcElement, Tooltip, Legend)

async function fetchCount(path: string): Promise<number> {
  const res = await fetch(path)
  const json = await res.json()
  return Array.isArray(json.data) ? json.data.length : 0
}

const TECH_STACK = [
  {
    category: 'Frontend',
    color: 'accent',
    icon: Globe,
    items: ['React 18', 'Vite 5', 'TypeScript 5', 'TanStack Query v5', 'React Router v6', 'CSS Modules'],
  },
  {
    category: 'Backend',
    color: 'blue',
    icon: Server,
    items: ['Hono 4', 'Node.js 20', 'Prisma 5', 'Zod'],
  },
  {
    category: 'Database',
    color: 'green',
    icon: Database,
    items: ['PostgreSQL 16', 'Docker Compose'],
  },
  {
    category: 'Tooling',
    color: 'purple',
    icon: Package,
    items: ['pnpm workspaces', 'lucide-react', 'chart.js'],
  },
]

const CHART_DATA = {
  labels: TECH_STACK.map(t => t.category),
  datasets: [{
    data: [40, 30, 15, 15],
    backgroundColor: ['#cc785c99', '#5c9ecc99', '#5ccc7899', '#785ccc99'],
    borderColor: ['#cc785c', '#5c9ecc', '#5ccc78', '#785ccc'],
    borderWidth: 2,
    hoverOffset: 6,
  }],
}

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { label: string; raw: unknown }) => ` ${ctx.label}: ${ctx.raw}%`,
      },
    },
  },
}

export default function Home() {
  const { data: todoCount = 0 } = useQuery({ queryKey: ['todo-count'], queryFn: () => fetchCount('/api/todos') })
  const { data: noteCount = 0 } = useQuery({ queryKey: ['note-count'], queryFn: () => fetchCount('/api/notes') })
  const { data: summaryCount = 0 } = useQuery({ queryKey: ['summary-count'], queryFn: () => fetchCount('/api/summaries') })

  const apps = [
    {
      to: '/todo',
      icon: CheckSquare,
      color: 'accent' as const,
      title: 'Todo',
      desc: '칸반 보드 · 우선순위 · 검색/필터',
      status: 'live' as const,
      stat: { value: todoCount, label: '개 항목' },
    },
    {
      to: '/note',
      icon: FileText,
      color: 'blue' as const,
      title: 'Note',
      desc: '자동저장 · 태그 · 핀 · 정렬',
      status: 'live' as const,
      stat: { value: noteCount, label: '개 메모' },
    },
    {
      to: '/data-viz',
      icon: BarChart2,
      color: 'green' as const,
      title: 'Data Visualizer',
      desc: 'CSV 업로드 · 5종 차트 · 통계',
      status: 'live' as const,
    },
    {
      to: '/youtube-summary',
      icon: Play,
      color: 'purple' as const,
      title: 'YouTube Summary',
      desc: 'AI 요약 · 카테고리 · 검색 · 메모',
      status: 'live' as const,
      stat: { value: summaryCount, label: '개 요약' },
    },
  ]

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroMeta}>
          <span className={styles.heroBadge}><Activity size={11} /> Claude Code</span>
          <span className={styles.heroVersion}>v0.3.0</span>
        </div>
        <h1 className={styles.heroTitle}>⚡ Test Lab</h1>
        <p className={styles.heroDesc}>
          Claude Code로 구축한 풀스택 모노레포 실험 공간<br />
          React · Hono · PostgreSQL · Prisma · Zod
        </p>
        <div className={styles.statRow}>
          <div className={styles.statItem}>
            <Layers size={16} className={styles.statIcon} />
            <span className={styles.statVal}>3</span>
            <span className={styles.statLbl}>Apps</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <CheckSquare size={16} className={styles.statIcon} />
            <span className={styles.statVal}>{todoCount}</span>
            <span className={styles.statLbl}>Todos</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <FileText size={16} className={styles.statIcon} />
            <span className={styles.statVal}>{noteCount}</span>
            <span className={styles.statLbl}>Notes</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <GitBranch size={16} className={styles.statIcon} />
            <span className={styles.statVal}>3</span>
            <span className={styles.statLbl}>Tiers</span>
          </div>
        </div>
      </section>

      {/* ── Apps ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Cpu size={15} /> Apps</h2>
        <div className={styles.appGrid}>
          {apps.map((app) => {
            const Icon = app.icon
            return (
              <Link key={app.to} to={app.to} className={`${styles.appCard} ${styles[`card_${app.color}`]}`}>
                <div className={styles.appCardHeader}>
                  <div className={`${styles.appIcon} ${styles[`icon_${app.color}`]}`}>
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <div className={styles.appMeta}>
                    <span className={styles.appTitle}>{app.title}</span>
                    <span className={`${styles.badge} ${styles.badgeLive}`}>Live</span>
                  </div>
                  {app.stat && (
                    <span className={styles.appStat}>{app.stat.value}<small>{app.stat.label}</small></span>
                  )}
                </div>
                <p className={styles.appDesc}>{app.desc}</p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Tech Stack + Chart ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Code2 size={15} /> Tech Stack</h2>
        <div className={styles.techLayout}>
          <div className={styles.techGrid}>
            {TECH_STACK.map(({ category, color, icon: Icon, items }) => (
              <div key={category} className={`${styles.techCard} ${styles[`tech_${color}`]}`}>
                <div className={styles.techHeader}>
                  <Icon size={14} />
                  <span>{category}</span>
                </div>
                <div className={styles.techItems}>
                  {items.map(item => (
                    <span key={item} className={styles.techBadge}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.chartBox}>
            <p className={styles.chartLabel}>기술 스택 분포</p>
            <div className={styles.donutWrap}>
              <Doughnut data={CHART_DATA} options={CHART_OPTIONS} />
              <div className={styles.donutCenter}>
                <span className={styles.donutNum}>14</span>
                <span className={styles.donutSub}>패키지</span>
              </div>
            </div>
            <div className={styles.chartLegend}>
              {TECH_STACK.map(({ category, color }, i) => (
                <div key={category} className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles[`dot_${color}`]}`} />
                  <span>{category}</span>
                  <span className={styles.legendPct}>{CHART_DATA.datasets[0].data[i]}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Architecture ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Layers size={15} /> Architecture</h2>
        <div className={styles.archRow}>
          <div className={styles.archCard}>
            <Globe size={20} className={styles.archIcon} />
            <span className={styles.archLabel}>Web</span>
            <span className={styles.archPort}>:5173</span>
            <span className={styles.archDesc}>React + Vite</span>
          </div>
          <div className={styles.archArrow}>→</div>
          <div className={styles.archCard}>
            <Server size={20} className={styles.archIcon} />
            <span className={styles.archLabel}>API</span>
            <span className={styles.archPort}>:3000</span>
            <span className={styles.archDesc}>Hono + Prisma</span>
          </div>
          <div className={styles.archArrow}>→</div>
          <div className={styles.archCard}>
            <Database size={20} className={styles.archIcon} />
            <span className={styles.archLabel}>DB</span>
            <span className={styles.archPort}>:5434</span>
            <span className={styles.archDesc}>PostgreSQL 16</span>
          </div>
        </div>
      </section>

    </div>
  )
}
