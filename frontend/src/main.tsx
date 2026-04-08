import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { THEME_STORAGE_KEY } from '@/context/theme-context'

const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

if (storedTheme === 'dark') {
  document.documentElement.classList.add('dark')
  document.documentElement.style.colorScheme = 'dark'
} else {
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = 'light'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
