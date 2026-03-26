import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Apply saved theme before render to avoid flash
const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light')
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { ToastProvider } from './contexts/ToastContext.tsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>
)
