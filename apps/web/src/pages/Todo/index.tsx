import { useState, useMemo } from 'react'
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, CheckSquare2, Clock, AlertCircle, Flag, SlidersHorizontal } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Todo, CreateTodo } from '@app/shared'
import { useToastContext } from '../../contexts/ToastContext'
import styles from './Todo.module.css'

const API = '/api/todos'

async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(API)
  const json = await res.json()
  return json.data
}

async function createTodo(body: CreateTodo): Promise<Todo> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json()).data
}

async function updateTodo({ id, ...patch }: Partial<Todo> & { id: string }): Promise<Todo> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return (await res.json()).data
}

async function deleteTodo(id: string): Promise<void> {
  await fetch(`${API}/${id}`, { method: 'DELETE' })
}

const STATUS_META: Record<string, { label: string; colorClass: string }> = {
  'todo':        { label: '할 일',   colorClass: 'colTodo' },
  'in-progress': { label: '진행 중', colorClass: 'colInProgress' },
  'done':        { label: '완료',    colorClass: 'colDone' },
}

const PRIORITY_COLORS: Record<string, string> = {
  none:   '#555',
  low:    '#5c9ecc',
  medium: '#cc9e5c',
  high:   '#cc5c78',
  urgent: '#cc3333',
}

const PRIORITY_LABELS: Record<string, string> = {
  none: '없음', low: '낮음', medium: '보통', high: '높음', urgent: '긴급',
}

const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low', 'none']

type StatusFilter = '' | 'todo' | 'in-progress' | 'done'

export default function Todo() {
  const qc = useQueryClient()
  const { showToast } = useToastContext()
  const [input, setInput] = useState('')
  const [newPriority, setNewPriority] = useState('none')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  const createMut = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todos'] })
      showToast('할 일이 추가되었습니다.', 'success')
    },
    onError: () => showToast('작업에 실패했습니다.', 'error'),
  })

  const updateMut = useMutation({
    mutationFn: updateTodo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
    onError: () => showToast('작업에 실패했습니다.', 'error'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todos'] })
      showToast('삭제되었습니다.', 'success')
    },
    onError: () => showToast('작업에 실패했습니다.', 'error'),
  })

  const isMutating = createMut.isPending || updateMut.isPending || deleteMut.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    createMut.mutate({ title: input.trim(), priority: newPriority as 'none' | 'low' | 'medium' | 'high' | 'urgent' })
    setInput('')
    setNewPriority('none')
  }

  const filtered = useMemo(() => {
    let result = todos
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t => t.title.toLowerCase().includes(q))
    }
    if (statusFilter) result = result.filter(t => t.status === statusFilter)
    if (priorityFilter) result = result.filter(t => t.priority === priorityFilter)
    // Sort by priority within each column
    return [...result].sort((a, b) =>
      PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
    )
  }, [todos, search, statusFilter, priorityFilter])

  const groups = {
    'todo':        filtered.filter(t => t.status === 'todo'),
    'in-progress': filtered.filter(t => t.status === 'in-progress'),
    'done':        filtered.filter(t => t.status === 'done'),
  }

  const doneCount = todos.filter(t => t.status === 'done').length
  const progressPct = todos.length ? Math.round(doneCount / todos.length * 100) : 0

  return (
    <div className={styles.page}>
      {/* ── 상단 폼 ── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <h1 className={styles.title}>Todo</h1>
          {todos.length > 0 && (
            <div className={styles.progressWrap}>
              <div className={styles.progressBar} style={{ width: `${progressPct}%` }} />
              <span className={styles.progressLabel}>{doneCount}/{todos.length} 완료</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="새 할 일 추가..."
            autoFocus
          />
          <div className={styles.priorityPicker}>
            <Flag size={12} style={{ color: PRIORITY_COLORS[newPriority] }} />
            <select
              className={styles.formPriority}
              value={newPriority}
              onChange={e => setNewPriority(e.target.value)}
            >
              <option value="none">없음</option>
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
              <option value="urgent">긴급</option>
            </select>
          </div>
          <button type="submit" className={styles.addBtn} disabled={!input.trim() || createMut.isPending}>
            <Plus size={15} strokeWidth={2.5} /> 추가
          </button>
        </form>
      </div>

      {/* ── 필터 툴바 ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="검색..."
          />
        </div>
        <div className={styles.filterGroup}>
          <SlidersHorizontal size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          {(['', 'todo', 'in-progress', 'done'] as StatusFilter[]).map((val) => (
            <button
              key={val}
              className={`${styles.filterBtn} ${statusFilter === val ? styles.filterActive : ''}`}
              onClick={() => setStatusFilter(val)}
            >
              {val === '' ? '전체' : STATUS_META[val].label}
            </button>
          ))}
        </div>
        <select
          className={styles.prioritySelect}
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
        >
          <option value="">전체 우선순위</option>
          <option value="urgent">긴급</option>
          <option value="high">높음</option>
          <option value="medium">보통</option>
          <option value="low">낮음</option>
          <option value="none">없음</option>
        </select>
      </div>

      {/* ── 칸반 보드 ── */}
      {isLoading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <div className={styles.board}>
          {(Object.entries(groups) as [string, Todo[]][]).map(([status, items]) => {
            const meta = STATUS_META[status]
            return (
              <div key={status} className={`${styles.column} ${styles[meta.colorClass]}`}>
                <div className={styles.colHeader}>
                  <div className={styles.colLabel}>
                    {status === 'todo'        && <Clock size={14} />}
                    {status === 'in-progress' && <AlertCircle size={14} />}
                    {status === 'done'        && <CheckSquare2 size={14} />}
                    <span>{meta.label}</span>
                  </div>
                  <span className={styles.colCount}>{items.length}</span>
                </div>

                <div className={styles.colBody}>
                  {items.length === 0 && (
                    <div className={styles.emptyCol}>비어 있음</div>
                  )}
                  {items.map(todo => (
                    <div
                      key={todo.id}
                      className={styles.card}
                      style={{ borderLeftColor: PRIORITY_COLORS[todo.priority] }}
                    >
                      <p className={styles.cardTitle}>{todo.title}</p>
                      <div className={styles.cardFooter}>
                        <select
                          className={styles.priorityBadge}
                          value={todo.priority}
                          style={{ color: PRIORITY_COLORS[todo.priority] }}
                          onChange={e => updateMut.mutate({ id: todo.id, priority: e.target.value as 'none' | 'low' | 'medium' | 'high' | 'urgent' })}
                          disabled={isMutating}
                        >
                          {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                        <div className={styles.cardActions}>
                          {status !== 'todo' && (
                            <button
                              className={styles.actionBtn}
                              title="이전 단계"
                              onClick={() => updateMut.mutate({ id: todo.id, status: status === 'in-progress' ? 'todo' : 'in-progress' })}
                              disabled={isMutating}
                            ><ChevronLeft size={13} /></button>
                          )}
                          {status !== 'done' && (
                            <button
                              className={styles.actionBtn}
                              title="다음 단계"
                              onClick={() => updateMut.mutate({ id: todo.id, status: status === 'todo' ? 'in-progress' : 'done' })}
                              disabled={isMutating}
                            ><ChevronRight size={13} /></button>
                          )}
                          <button
                            className={`${styles.actionBtn} ${styles.deleteBtnCard}`}
                            title="삭제"
                            onClick={() => deleteMut.mutate(todo.id)}
                            disabled={isMutating}
                          ><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
