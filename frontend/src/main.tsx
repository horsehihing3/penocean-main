import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ko } from 'date-fns/locale'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeContextProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { ConfirmDialogProvider } from './components/common/ConfirmDialogProvider'
import { queryClient } from './lib/queryClient'
import './i18n/config'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeContextProvider>
          <LanguageProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
              <CssBaseline />
              <AuthProvider>
                <ConfirmDialogProvider>
                  <App />
                </ConfirmDialogProvider>
              </AuthProvider>
            </LocalizationProvider>
          </LanguageProvider>
        </ThemeContextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
