import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'
import 'leaflet/dist/leaflet.css'
import { store } from './dashboard/store'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'Space Grotesk', sans-serif",
              borderRadius: '16px',
              padding: '16px',
            },
            className: 'glass',
          }}
          richColors
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
