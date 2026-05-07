import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(10,15,30,0.95)',
            color: '#f8fafc',
            border: '1px solid rgba(78,205,196,0.25)',
            backdropFilter: 'blur(20px)',
            borderRadius: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#4ecdc4', secondary: '#080d1a' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#080d1a' } },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
)
