import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { StarsProvider } from './context/StarsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StarsProvider>
      <App />
    </StarsProvider>
  </StrictMode>,
)
