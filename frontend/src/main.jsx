import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/input.css'
import {AuthProvider} from './components/context/context.jsx'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
    <App />
    </AuthProvider>
  </React.StrictMode>
)
