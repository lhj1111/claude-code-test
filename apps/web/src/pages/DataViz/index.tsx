import { useState, useRef, useCallback, useMemo } from 'react'
import { Upload, Download, Search } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import styles from './DataViz.module.css'

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler
)

// ── CSV 파서 (RFC 4180) ─────────────────────────────────────────────────────
type Row = Record<string, number | string>

function parseCSV(text: string): { headers: string[]; data: Row[] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length === 0) return { headers: [], data: [] }
  const headers = parseLine(lines[0])
  const data: Row[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    if (!values.length) continue
    const row: Row = {}
    headers.forEach((h, idx) => {
      const raw = values[idx] ?? ''
      const num = Number(raw)
      row[h] = raw !== '' && !isNaN(num) ? num : raw
    })
    data.push(row)
  }
  return { headers, data }
}

function parseLine(line: string): string[] {
  const result: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (ch === ',' && !inQ) {
      result.push(cur.trim()); cur = ''
    } else cur += ch
  }
  result.push(cur.trim())
  return result
}

function getNumericCols(headers: string[], data: Row[]) {
  return headers.filter(h => data.some(r => typeof r[h] === 'number'))
}

function computeStats(data: Row[], col: string) {
  const vals = data.map(r => r[col]).filter((v): v is number => typeof v === 'number')
  if (!vals.length) return null
  const sum = vals.reduce((a, b) => a + b, 0)
  return {
    count: vals.length,
    sum: +sum.toFixed(4),
    avg: +(sum / vals.length).toFixed(4),
    max: Math.max(...vals),
    min: Math.min(...vals),
  }
}

function sampleRows(data: Row[], max = 500) {
  if (data.length <= max) return data
  const step = data.length / max
  return Array.from({ length: max }, (_, i) => data[Math.floor(i * step)])
}

// ── 샘플 데이터 ─────────────────────────────────────────────────────────────
const SAMPLES_RAW = [
  { name: 'Monthly Sales', csv: `Month,Revenue,Expenses,Profit\nJan,42000,28000,14000\nFeb,38000,25000,13000\nMar,51000,31000,20000\nApr,47000,29000,18000\nMay,55000,33000,22000\nJun,62000,38000,24000\nJul,58000,36000,22000\nAug,65000,40000,25000\nSep,70000,43000,27000\nOct,67000,41000,26000\nNov,73000,45000,28000\nDec,80000,50000,30000` },
  { name: 'User Growth', csv: `Week,New Users,Active Users,Churned\n1,1200,8500,320\n2,1450,9200,290\n3,1380,9800,310\n4,1620,10400,280\n5,1750,11200,260\n6,1900,12100,240\n7,2100,13000,220\n8,2350,14200,200\n9,2600,15500,185\n10,2900,17000,170` },
  { name: 'Market Share', csv: `Platform,Share\nWindows,72.5\nmacOS,15.2\nLinux,3.1\nChromeOS,4.8\nOther,4.4` },
  { name: 'Seoul Temperature', csv: `Month,최고기온,평균기온,최저기온\n1월,-1.2,-3.8,-6.5\n2월,3.1,0.4,-2.3\n3월,11.4,6.9,2.5\n4월,19.2,14.1,9.0\n5월,25.1,19.8,14.5\n6월,29.4,24.5,19.7\n7월,30.1,26.7,23.3\n8월,31.2,27.5,23.9\n9월,26.3,22.0,17.7\n10월,19.8,14.9,10.1\n11월,10.4,6.1,2.0\n12월,2.1,-1.5,-5.1` },
  { name: 'Revenue by Category', csv: `Category,Q1,Q2,Q3,Q4\nElectronics,45000,52000,61000,88000\nClothing,28000,35000,32000,51000\nFood,62000,58000,65000,70000\nBooks,12000,11000,13000,15000\nSports,19000,31000,35000,22000` },
]
const SAMPLES = SAMPLES_RAW.map(s => ({ name: s.name, ...parseCSV(s.csv) }))

// ── 차트 색상 팔레트 ─────────────────────────────────────────────────────────
const PALETTE = ['#cc785c','#5c9ecc','#5ccc78','#cc5c78','#cc9e5c','#785ccc','#5ccccc']

type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'doughnut'
const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' },
  { value: 'doughnut', label: 'Doughnut' },
]

// ── 차트 데이터 빌더 ─────────────────────────────────────────────────────────
function buildChartData(display: Row[], xCol: string, yCols: string[], type: ChartType) {
  const labels = display.map(r => String(r[xCol] ?? ''))
  const textColor = '#e8e8e8'
  const gridColor = '#2a2a2a'

  if (type === 'pie' || type === 'doughnut') {
    const col = yCols[0]
    const vals = display.map(r => Number(r[col]) || 0)
    return {
      data: { labels, datasets: [{ label: col, data: vals, backgroundColor: PALETTE.slice(0, vals.length), borderColor: '#161616', borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' as const, labels: { color: textColor } } } },
    }
  }

  const datasets = yCols.map((col, i) => {
    const color = PALETTE[i % PALETTE.length]
    const vals = display.map(r => Number(r[col]) || 0)
    if (type === 'bar') return { label: col, data: vals, backgroundColor: color + 'cc', borderColor: color, borderWidth: 1, borderRadius: 3 }
    return { label: col, data: vals, borderColor: color, backgroundColor: type === 'area' ? color + '33' : color + '00', fill: type === 'area', tension: 0.35, borderWidth: 2, pointRadius: display.length > 60 ? 0 : 3 }
  })

  return {
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textColor, maxRotation: 45, autoSkip: true, maxTicksLimit: 20 }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } },
      },
    },
  }
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function DataViz() {
  const [headers, setHeaders] = useState<string[]>([])
  const [data, setData] = useState<Row[]>([])
  const [datasetName, setDatasetName] = useState('')
  const [xCol, setXCol] = useState('')
  const [yCols, setYCols] = useState<string[]>([])
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [chartTitle, setChartTitle] = useState('')
  const [dragging, setDragging] = useState(false)
  const [sortCol, setSortCol] = useState('')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(0)
  const [tableSearch, setTableSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const PAGE_SIZE = 20

  const numericCols = useMemo(() => getNumericCols(headers, data), [headers, data])

  const loadData = useCallback((name: string, h: string[], d: Row[]) => {
    setHeaders(h); setData(d); setDatasetName(name)
    setXCol(h[0] ?? '')
    const firstNum = h.find(col => d.some(r => typeof r[col] === 'number'))
    setYCols(firstNum ? [firstNum] : [])
    setPage(0); setSortCol(''); setSortAsc(true); setTableSearch('')
  }, [])

  function exportCSV() {
    if (!filteredData.length) return
    const exportRows = tableSearch ? filteredData : sortedData
    const rows = [headers.join(','), ...exportRows.map(row =>
      headers.map(h => {
        const v = String(row[h] ?? '')
        return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
      }).join(',')
    )]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${datasetName || 'data'}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) return
    const reader = new FileReader()
    reader.onload = e => {
      const { headers: h, data: d } = parseCSV(e.target?.result as string)
      loadData(file.name, h, d)
    }
    reader.readAsText(file)
  }, [loadData])

  const toggleYCol = (col: string) =>
    setYCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])

  const handleSort = (col: string) => {
    if (sortCol === col) setSortAsc(a => !a)
    else { setSortCol(col); setSortAsc(true) }
    setPage(0)
  }

  const sortedData = useMemo(() => {
    if (!sortCol) return data
    return [...data].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol]
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
  }, [data, sortCol, sortAsc])

  const filteredData = useMemo(() => {
    if (!tableSearch) return sortedData
    const q = tableSearch.toLowerCase()
    return sortedData.filter(row =>
      headers.some(h => String(row[h] ?? '').toLowerCase().includes(q))
    )
  }, [sortedData, tableSearch, headers])

  const pagedData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE)

  const hasData = data.length > 0
  const canChart = hasData && xCol && yCols.length > 0

  const displayData = sampleRows(data, 500)
  const chartBuild = canChart ? buildChartData(displayData, xCol, yCols, chartType) : null
  if (chartBuild && chartTitle) {
    (chartBuild.options as { plugins: { title?: { display: boolean; text: string; color: string } } }).plugins.title = { display: true, text: chartTitle, color: '#e8e8e8' }
  }
  const ChartComp = { bar: Bar, line: Line, area: Line, pie: Pie, doughnut: Doughnut }[chartType]

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* ── 사이드바 ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sideSection}>
            <div
              className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={26} style={{color:'var(--accent)', opacity:0.8}} />
              <span className={styles.dropText}>CSV 드래그 또는 클릭</span>
              <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>

            <div className={styles.samples}>
              <p className={styles.sectionLabel}>샘플 데이터</p>
              {SAMPLES.map(s => (
                <button key={s.name} className={`${styles.sampleBtn} ${datasetName === s.name ? styles.sampleActive : ''}`} onClick={() => loadData(s.name, s.headers, s.data)}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {hasData && (
            <>
              <div className={styles.sideSection}>
                <p className={styles.sectionLabel}>X축</p>
                <select className={styles.select} value={xCol} onChange={e => setXCol(e.target.value)}>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className={styles.sideSection}>
                <p className={styles.sectionLabel}>Y축 (복수 선택)</p>
                <div className={styles.checkList}>
                  {numericCols.map(col => (
                    <label key={col} className={styles.checkItem}>
                      <input type="checkbox" checked={yCols.includes(col)} onChange={() => toggleYCol(col)} />
                      {col}
                    </label>
                  ))}
                  {numericCols.length === 0 && <p className={styles.dimText}>숫자형 컬럼 없음</p>}
                </div>
              </div>

              <div className={styles.sideSection}>
                <p className={styles.sectionLabel}>통계</p>
                {yCols.slice(0, 2).map(col => {
                  const s = computeStats(data, col)
                  if (!s) return null
                  return (
                    <div key={col} className={styles.statCard}>
                      <p className={styles.statCol}>{col}</p>
                      <div className={styles.statGrid}>
                        <span>합계</span><span>{s.sum.toLocaleString()}</span>
                        <span>평균</span><span>{s.avg.toLocaleString()}</span>
                        <span>최대</span><span>{s.max.toLocaleString()}</span>
                        <span>최소</span><span>{s.min.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </aside>

        {/* ── 메인 영역 ── */}
        <main className={styles.main}>
          {!hasData ? (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>📊</p>
              <p className={styles.emptyText}>좌측에서 CSV 파일을 업로드하거나 샘플 데이터를 선택하세요</p>
            </div>
          ) : (
            <>
              <div className={styles.chartArea}>
                <div className={styles.chartToolbar}>
                  <span className={styles.dsName}>{datasetName}</span>
                  <span className={styles.rowCount}>{data.length.toLocaleString()}행 · {headers.length}열</span>
                  <input
                    className={styles.chartTitleInput}
                    value={chartTitle}
                    onChange={e => setChartTitle(e.target.value)}
                    placeholder="차트 제목..."
                  />
                  <div className={styles.chartTypeTabs}>
                    {CHART_TYPES.map(t => (
                      <button key={t.value} className={`${styles.tabBtn} ${chartType === t.value ? styles.tabActive : ''}`} onClick={() => setChartType(t.value)}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <button className={styles.exportBtn} onClick={exportCSV} title="CSV 내보내기"><Download size={13} /> CSV 내보내기</button>
                </div>

                {canChart ? (
                  <div className={styles.chartWrap}>
                    <ChartComp data={chartBuild!.data as never} options={chartBuild!.options as never} />
                  </div>
                ) : (
                  <div className={styles.chartPlaceholder}>Y축 컬럼을 선택하세요</div>
                )}
              </div>

              <div className={styles.tableArea}>
                <div className={styles.tableToolbar}>
                  <Search size={13} style={{color:'var(--text-muted)'}} />
                  <input
                    className={styles.tableSearchInput}
                    value={tableSearch}
                    onChange={e => { setTableSearch(e.target.value); setPage(0) }}
                    placeholder="테이블 검색..."
                  />
                  {tableSearch && (
                    <span className={styles.filterCount}>{filteredData.length}행 필터됨</span>
                  )}
                </div>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {headers.map(h => (
                        <th key={h} className={styles.th} onClick={() => handleSort(h)}>
                          {h} {sortCol === h ? (sortAsc ? '↑' : '↓') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedData.map((row, i) => (
                      <tr key={i} className={styles.tr}>
                        {headers.map(h => <td key={h} className={styles.td}>{String(row[h] ?? '')}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button className={styles.pageBtn} disabled={page === 0} onClick={() => setPage(p => p - 1)}>← 이전</button>
                    <span className={styles.pageInfo}>{page + 1} / {totalPages}</span>
                    <button className={styles.pageBtn} disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>다음 →</button>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
