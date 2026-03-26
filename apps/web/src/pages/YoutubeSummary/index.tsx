import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Summary, CreateSummary, SummaryCategory, SummaryProvider } from '@app/shared'
import styles from './YoutubeSummary.module.css'

const API = '/api/summaries'

async function fetchSummaries(params: { category?: string; q?: string }): Promise<Summary[]> {
  const url = new URL(API, window.location.origin)
  if (params.category && params.category !== 'ALL') url.searchParams.set('category', params.category)
  if (params.q) url.searchParams.set('q', params.q)
  const res = await fetch(url.toString())
  const json = await res.json()
  return json.data
}

async function fetchSummary(id: string): Promise<Summary> {
  const res = await fetch(`${API}/${id}`)
  const json = await res.json()
  return json.data
}

async function createSummary(data: CreateSummary): Promise<Summary> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  return json.data
}

async function updateMemo(id: string, memo: string): Promise<Summary> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memo }),
  })
  const json = await res.json()
  return json.data
}

async function deleteSummary(id: string): Promise<void> {
  await fetch(`${API}/${id}`, { method: 'DELETE' })
}

const CATEGORIES: Array<{ value: 'ALL' | SummaryCategory; label: string }> = [
  { value: 'ALL', label: 'ALL' },
  { value: 'TECH', label: 'TECH' },
  { value: 'ECONOMY', label: 'ECONOMY' },
  { value: 'ENTERTAINMENT', label: 'ENTERTAINMENT' },
  { value: 'EDUCATION', label: 'EDUCATION' },
  { value: 'OTHER', label: 'OTHER' },
]

const STATUS_ICON: Record<string, string> = {
  PENDING: '⏳',
  PROCESSING: '🔄',
  DONE: '✅',
  ERROR: '❌',
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

function formatAbsoluteDateTime(dateStr: string) {
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}년 ${m}월 ${d}일 ${hh}:${mm}`
}

function shortenUrl(url: string) {
  try {
    const u = new URL(url)
    return u.hostname + u.pathname.slice(0, 20)
  } catch {
    return url.slice(0, 30)
  }
}

export default function YoutubeSummary() {
  const qc = useQueryClient()

  // Form state
  const [urlInput, setUrlInput] = useState('')
  const [formCategory, setFormCategory] = useState<SummaryCategory>('OTHER')
  const [formProvider, setFormProvider] = useState<SummaryProvider>('GEMINI')

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | SummaryCategory>('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Multi-select state
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  // Memo edit state
  const [memoText, setMemoText] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Memo auto-save state
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'pending' | 'saved'>('idle')

  // Copy state
  const [copied, setCopied] = useState(false)

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQ(searchInput), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput])

  // Queries
  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['summaries', { category: categoryFilter, q: debouncedQ }],
    queryFn: () => fetchSummaries({ category: categoryFilter, q: debouncedQ }),
  })

  const { data: detail } = useQuery({
    queryKey: ['summary', selectedId],
    queryFn: () => fetchSummary(selectedId!),
    enabled: !!selectedId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === 'PENDING' || data?.status === 'PROCESSING') return 2000
      return false
    },
  })

  // Sync memo textarea when detail changes
  useEffect(() => {
    if (detail) setMemoText(detail.memo)
  }, [detail?.id, detail?.memo])

  // Mutations
  const createMut = useMutation({
    mutationFn: createSummary,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['summaries'] })
      setSelectedId(created.id)
      setUrlInput('')
    },
  })

  const memoMut = useMutation({
    mutationFn: ({ id, memo }: { id: string; memo: string }) => updateMemo(id, memo),
    onSuccess: () => {
      setSaveState('saved')
      qc.invalidateQueries({ queryKey: ['summary', selectedId] })
      setTimeout(() => setSaveState('idle'), 2000)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteSummary,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['summaries'] })
      setSelectedId(null)
    },
  })

  const bulkDeleteMut = useMutation({
    mutationFn: (ids: string[]) =>
      fetch('/api/summaries/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      }).then(r => r.json()),
    onSuccess: (_, ids) => {
      if (selectedId && ids.includes(selectedId)) setSelectedId(null)
      qc.invalidateQueries({ queryKey: ['summaries'] })
      setCheckedIds(new Set())
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!urlInput.trim() || createMut.isPending) return
    createMut.mutate({ url: urlInput.trim(), category: formCategory, provider: formProvider })
  }

  function handleMemoChange(value: string) {
    setMemoText(value)
    setSaveState('pending')
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      if (selectedId) {
        memoMut.mutate({ id: selectedId, memo: value })
      }
    }, 2000)
  }

  function handleDelete() {
    if (!selectedId) return
    deleteMut.mutate(selectedId)
  }

  function handleCheck(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setCheckedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleCopy() {
    if (!detail?.summary) return
    navigator.clipboard.writeText(detail.summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={styles.page}>
      {/* Header + Form */}
      <div className={styles.header}>
        <h1 className={styles.title}>YouTube Summary</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.urlInput}
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            required
          />
          {/* Provider 선택 토글 버튼 */}
          <div className={styles.providerToggle}>
            <div className={styles.providerBtnWrap}>
              <button
                type="button"
                className={`${styles.providerBtn} ${formProvider === 'CLAUDE' ? styles.providerActive : ''}`}
                onClick={() => setFormProvider('CLAUDE')}
                disabled
              >
                🤖 Claude
              </button>
            </div>
            <div className={styles.providerBtnWrap}>
              <button
                type="button"
                className={`${styles.providerBtn} ${formProvider === 'OPENAI' ? styles.providerActive : ''}`}
                onClick={() => setFormProvider('OPENAI')}
                disabled
              >
                ✨ GPT-4o
              </button>
            </div>
            <div className={styles.providerBtnWrap}>
              <button
                type="button"
                className={`${styles.providerBtn} ${formProvider === 'GEMINI' ? styles.providerActive : ''}`}
                onClick={() => setFormProvider('GEMINI')}
              >
                ♊ Gemini
              </button>
            </div>
          </div>
          <select
            className={styles.categorySelect}
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value as SummaryCategory)}
          >
            {CATEGORIES.filter((c) => c.value !== 'ALL').map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={createMut.isPending || !urlInput.trim()}
          >
            {createMut.isPending ? '요청 중...' : '요약 시작'}
          </button>
        </form>
      </div>

      {/* Main content grid */}
      <div className={styles.content}>
        {/* Left sidebar: list */}
        <aside className={styles.sidebar}>
          <input
            className={styles.searchInput}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="검색..."
          />

          <div className={styles.filterTabs}>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                className={`${styles.tab} ${categoryFilter === c.value ? styles.tabActive : ''}`}
                onClick={() => setCategoryFilter(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className={styles.listContainer}>
          {isLoading ? (
            <p className={styles.emptyState}>불러오는 중...</p>
          ) : summaries.length === 0 ? (
            <p className={styles.emptyState}>
              {debouncedQ || categoryFilter !== 'ALL'
                ? '검색 결과가 없습니다'
                : '첫 번째 영상을 요약해보세요'}
            </p>
          ) : (
            <ul className={styles.list}>
              {summaries.map((s) => (
                <li
                  key={s.id}
                  className={`${styles.item} ${selectedId === s.id ? styles.itemSelected : ''}`}
                  onClick={() => setSelectedId(s.id)}
                >
                  <div className={styles.itemRow}>
                    <input
                      type="checkbox"
                      className={styles.itemCheckbox}
                      checked={checkedIds.has(s.id)}
                      onClick={(e) => handleCheck(e, s.id)}
                      onChange={() => {}}
                    />
                    <span className={styles.statusIcon}>{STATUS_ICON[s.status]}</span>
                    <span className={styles.itemTitle}>
                      {s.title || shortenUrl(s.url)}
                    </span>
                  </div>
                  <div className={styles.itemMeta}>
                    <span className={styles.badge}>{s.category}</span>
                    <span className={styles.itemDate}>{formatRelativeDate(s.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          </div>

          {checkedIds.size > 0 && (
            <div className={styles.actionBar}>
              <span>{checkedIds.size}개 선택됨</span>
              <button
                onClick={() => bulkDeleteMut.mutate(Array.from(checkedIds))}
                disabled={bulkDeleteMut.isPending}
              >
                일괄 삭제 🗑
              </button>
            </div>
          )}
        </aside>

        {/* Right detail panel */}
        <section className={styles.detail}>
          {!selectedId ? (
            <div className={styles.emptyState}>
              <p>목록에서 요약을 선택하세요</p>
            </div>
          ) : !detail ? (
            <div className={styles.emptyState}>
              <p>불러오는 중...</p>
            </div>
          ) : detail.status === 'PENDING' || detail.status === 'PROCESSING' ? (
            <div className={styles.processingPanel}>
              <p className={styles.processingText}>
                {STATUS_ICON[detail.status]} AI가 요약 중입니다...
              </p>
              <div className={styles.progressBarWrap}>
                <div className={styles.progressBar} />
              </div>
              <p className={styles.processingUrl}>{detail.url}</p>
            </div>
          ) : detail.status === 'ERROR' ? (
            <div className={styles.errorState}>
              <p className={styles.errorTitle}>❌ 요약 실패</p>
              <p className={styles.errorMsg}>{detail.errorMsg ?? '알 수 없는 오류가 발생했습니다.'}</p>
              <p className={styles.errorUrl}>{detail.url}</p>
              <button className={styles.deleteBtn} onClick={handleDelete}>삭제</button>
            </div>
          ) : (
            /* DONE */
            <div className={styles.donePanel}>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailTitle}>{detail.title || '제목 없음'}</h2>
                <div className={styles.detailMeta}>
                  <span className={styles.badge}>{detail.category}</span>
                  <span className={styles.providerBadge}>
                    {detail.provider === 'CLAUDE' ? '🤖 Claude' : detail.provider === 'OPENAI' ? '✨ GPT-4o' : '♊ Gemini'}
                  </span>
                  <span className={styles.itemDate} title={formatAbsoluteDateTime(detail.createdAt)}>
                    {formatRelativeDate(detail.createdAt)}
                  </span>
                  <span className={styles.createdAt}>{formatAbsoluteDateTime(detail.createdAt)}</span>
                  <a
                    className={styles.detailLink}
                    href={detail.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    YouTube에서 보기 ↗
                  </a>
                  <button className={styles.deleteBtn} onClick={handleDelete}>삭제</button>
                </div>
              </div>

              <div className={styles.summarySection}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionLabel}>요약</h3>
                  <button className={styles.copyBtn} onClick={handleCopy}>
                    {copied ? '✓ 복사됨' : '📋 복사'}
                  </button>
                </div>
                <p className={styles.summaryText}>{detail.summary}</p>
              </div>

              <div className={styles.memoSection}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionLabel}>메모</h3>
                  {saveState === 'pending' && <span className={styles.savePending}>편집 중...</span>}
                  {saveState === 'saved' && <span className={styles.saveDone}>✓ 저장됨</span>}
                </div>
                <textarea
                  className={styles.memoArea}
                  value={memoText}
                  onChange={(e) => handleMemoChange(e.target.value)}
                  placeholder="메모를 입력하세요..."
                  rows={4}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
