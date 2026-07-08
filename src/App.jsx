// Routes
import { AppRouter } from '@routes'

// Styles
import './App.css'

// Redux
import { store } from '@store'
import { Provider } from 'react-redux'

// SEO
import { HelmetProvider } from 'react-helmet-async'

// Socket
import { SocketProvider } from '@store/context'

// Provider order: SEO -> Redux -> Socket (needs Redux state) -> Router
export const App = () => {
  return (
    <HelmetProvider>
      <Provider store={store}>
        <SocketProvider>
          <AppRouter />
        </SocketProvider>
      </Provider>
    </HelmetProvider>
  )
}
