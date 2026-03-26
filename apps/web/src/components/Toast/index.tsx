import type { Toast } from '../../hooks/useToast'
import styles from './Toast.module.css'

interface Props {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export default function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null

  return (
    <div className={styles.container}>
      {toasts.map(toast => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <span className={styles.message}>{toast.message}</span>
          <button className={styles.close} onClick={() => onRemove(toast.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
