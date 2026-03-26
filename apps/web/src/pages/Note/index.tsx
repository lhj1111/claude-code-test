import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Note, CreateNote, UpdateNote } from '@app/shared'
import { useToastContext } from '../../contexts/ToastContext'
import { Plus, Search, Save, Trash2, FileText, Hash } from 'lucide-react'
import styles from './Note.module.css'

const API = '/api/notes'

async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(API)
  const json = await res.json()
  return json.data
}

async function createNote(body: CreateNote): Promise<Note> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json()).data
}

async function updateNote({ id, ...patch }: UpdateNote & { id: string }): Promise<Note> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return (await res.json()).data
}

async function deleteNote(id: string): Promise<void> {
  await fetch(`${API}/${id}`, { method: 'DELETE' })
}

type SaveStatus = 'idle' | 'saving' | 'saved'
type SortBy = 'updated-desc' | 'updated-asc' | 'title-asc' | 'title-desc'

export default function Note() {
  const qc = useQueryClient()
  const { showToast } = useToastContext()
  const [selected, setSelected] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingTags, setEditingTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('updated-desc')
  const [tagFilter, setTagFilter] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSaveRef = useRef<() => void>(() => {})

  const { data: notes = [], isLoading } = useQuery({ queryKey: ['notes'], queryFn: fetchNotes })

  const createMut = useMutation({
    mutationFn: createNote,
    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      selectNote(note)
      setIsNew(false)
      showToast('메모가 생성되었습니다.', 'success')
    },
    onError: () => showToast('작업에 실패했습니다.', 'error'),
  })

  const updateMut = useMutation({
    mutationFn: updateNote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      setSaveStatus('saved')
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: () => {
      setSaveStatus('idle')
      showToast('작업에 실패했습니다.', 'error')
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      setSelected(null)
      setTitle('')
      setContent('')
      setEditingTags([])
      showToast('삭제되었습니다.', 'success')
    },
    onError: () => showToast('작업에 실패했습니다.', 'error'),
  })

  // Autosave with 1.5s debounce for existing notes (title/content only)
  useEffect(() => {
    if (!selected || isNew) return
    if (title === selected.title && content === selected.content) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (!title.trim()) return
      setSaveStatus('saving')
      updateMut.mutate({ id: selected.id, title: title.trim(), content, isPinned: selected.isPinned, tags: editingTags })
    }, 1500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [title, content]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update selected ref when notes refetch
  useEffect(() => {
    if (selected) {
      const updated = notes.find(n => n.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [notes]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        startNew()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function selectNote(note: Note) {
    setSelected(note)
    setTitle(note.title)
    setContent(note.content)
    setEditingTags(note.tags ?? [])
    setTagInput('')
    setIsNew(false)
    setSaveStatus('idle')
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }

  function startNew() {
    setSelected(null)
    setTitle('')
    setContent('')
    setEditingTags([])
    setTagInput('')
    setIsNew(true)
    setSaveStatus('idle')
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }

  function handleSave() {
    if (!title.trim()) return
    if (isNew) {
      createMut.mutate({ title: title.trim(), content, tags: editingTags, isPinned: false })
    } else if (selected) {
      setSaveStatus('saving')
      updateMut.mutate({ id: selected.id, title: title.trim(), content, tags: editingTags, isPinned: selected.isPinned })
    }
  }
  handleSaveRef.current = handleSave

  function handleDelete() {
    if (selected) deleteMut.mutate(selected.id)
  }

  function togglePin() {
    if (!selected) return
    updateMut.mutate({ id: selected.id, isPinned: !selected.isPinned })
    setSelected({ ...selected, isPinned: !selected.isPinned })
  }

  function addTag() {
    const tag = tagInput.trim()
    if (!tag || editingTags.includes(tag)) { setTagInput(''); return }
    const newTags = [...editingTags, tag]
    setEditingTags(newTags)
    setTagInput('')
    if (selected) updateMut.mutate({ id: selected.id, tags: newTags })
  }

  function removeTag(tag: string) {
    const newTags = editingTags.filter(t => t !== tag)
    setEditingTags(newTags)
    if (selected) updateMut.mutate({ id: selected.id, tags: newTags })
  }

  // All unique tags across all notes (for filter)
  const allTags = useMemo(() => {
    const set = new Set<string>()
    notes.forEach(n => (n.tags ?? []).forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [notes])

  const filteredNotes = useMemo(() => {
    let result = notes
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      )
    }
    if (tagFilter) {
      result = result.filter(n => (n.tags ?? []).includes(tagFilter))
    }
    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'updated-desc') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      if (sortBy === 'updated-asc') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title, 'ko')
      if (sortBy === 'title-desc') return b.title.localeCompare(a.title, 'ko')
      return 0
    })
    // Pinned notes first
    return [...result.filter(n => n.isPinned), ...result.filter(n => !n.isPinned)]
  }, [notes, search, sortBy, tagFilter])

  const saveIndicator = saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '저장됨 ✓' : null
  const charCount = content.length
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Notes</h2>
          <button className={styles.newBtn} onClick={startNew} title="새 메모 (Ctrl+N)"><Plus size={14} strokeWidth={2.5} /></button>
        </div>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="검색..."
          />
        </div>
        <div className={styles.sidebarControls}>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortBy)}
          >
            <option value="updated-desc">최신 수정</option>
            <option value="updated-asc">오래된 수정</option>
            <option value="title-asc">제목 A-Z</option>
            <option value="title-desc">제목 Z-A</option>
          </select>
          {allTags.length > 0 && (
            <select
              className={styles.sortSelect}
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
            >
              <option value="">전체 태그</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
        {isLoading ? (
          <p className={styles.loading}>Loading...</p>
        ) : filteredNotes.length === 0 ? (
          <p className={styles.empty}>{search ? '검색 결과가 없습니다' : '메모가 없습니다'}</p>
        ) : (
          <ul className={styles.list}>
            {filteredNotes.map(note => (
              <li
                key={note.id}
                className={`${styles.item} ${selected?.id === note.id ? styles.itemActive : ''}`}
                onClick={() => selectNote(note)}
              >
                <div className={styles.itemHeader}>
                  {note.isPinned && <span className={styles.pinIcon}>📌</span>}
                  <span className={styles.itemTitle}>{note.title}</span>
                </div>
                {(note.tags ?? []).length > 0 && (
                  <div className={styles.itemTags}>
                    {(note.tags ?? []).slice(0, 3).map(t => (
                      <span key={t} className={styles.tagChip}>{t}</span>
                    ))}
                  </div>
                )}
                <span className={styles.itemDate}>
                  {new Date(note.updatedAt).toLocaleDateString('ko-KR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className={styles.editor}>
        {!selected && !isNew ? (
          <div className={styles.emptyEditor}>
            <FileText size={32} style={{color:'var(--text-muted)'}} />
            <p>메모를 선택하거나</p>
            <button className={styles.newBtnLarge} onClick={startNew}><Plus size={16} /> 새 메모 작성</button>
            <p className={styles.shortcutHint}>Ctrl+N · Ctrl+S</p>
          </div>
        ) : (
          <>
            <div className={styles.editorHeader}>
              <input
                className={styles.titleInput}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="제목"
              />
              <div className={styles.editorActions}>
                {saveIndicator && (
                  <span className={styles.saveIndicator}>{saveIndicator}</span>
                )}
                {selected && (
                  <button
                    className={`${styles.pinBtn} ${selected.isPinned ? styles.pinBtnActive : ''}`}
                    onClick={togglePin}
                    title={selected.isPinned ? '고정 해제' : '메모 고정'}
                  >
                    📌
                  </button>
                )}
                <button className={styles.saveBtn} onClick={handleSave} disabled={!title.trim()} title="저장 (Ctrl+S)">
                  <Save size={13} /> 저장
                </button>
                {selected && (
                  <button className={styles.deleteBtn} onClick={handleDelete}><Trash2 size={13} /> 삭제</button>
                )}
              </div>
            </div>
            <div className={styles.tagsRow}>
              {editingTags.map(tag => (
                <span key={tag} className={styles.tagPill}>
                  {tag}
                  <button className={styles.tagRemove} onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
              <Hash size={12} style={{color:'var(--text-muted)', flexShrink:0}} />
              <input
                className={styles.tagInput}
                value={tagInput}
                onChange={e => {
                  const val = e.target.value
                  if (val.endsWith(',')) {
                    setTagInput(val.slice(0, -1))
                    setTimeout(addTag, 0)
                  } else {
                    setTagInput(val)
                  }
                }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                onBlur={addTag}
                placeholder="Enter 또는 쉼표로 추가"
              />
            </div>
            <textarea
              className={styles.contentInput}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력하세요..."
            />
            <div className={styles.editorFooter}>
              <span>{charCount}자 · {wordCount}단어</span>
              {selected && (
                <span>작성: {new Date(selected.createdAt).toLocaleDateString('ko-KR')}</span>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
