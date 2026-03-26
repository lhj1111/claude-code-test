import { createContext, useContext, ReactNode } from 'react'
import { useToast, ToastType } from '../hooks/useToast'
import ToastContainer from '../components/Toast'

const ToastContext = createContext<{
  showToast: (message: string, type?: ToastType) => void
} | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, showToast, removeToast } = useToast()
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider')
  return ctx
}
