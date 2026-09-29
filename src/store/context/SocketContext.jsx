/* This file intentionally exports a hook (useSocket) alongside the provider,
   and the connection effect drives an external system (Socket.IO) so it must
   call setState synchronously to store/tear down the socket instance. */
/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useSelector } from 'react-redux'
import { API_ORIGIN } from '@utils/apiOrigin'

const SocketContext = createContext(null)

// Same origin as the site by default (socket.io connects to it when the URL is undefined;
// Vite proxies /socket.io in dev). VITE_API_URL points it at another origin.
const SOCKET_URL = API_ORIGIN || undefined

/**
 * One authenticated Socket.IO connection for the signed-in admin (server: services/SocketService).
 * The server only pushes; the admin listens (see useAdminLiveUpdates):
 *   admin:alert       { kind, title, message, … }  → admins room (new user, new report, …)
 *   notification:new  { type, title, message }     → this admin
 *   account:status    { status, reason, until }    → this admin (suspended / banned)
 *   app:maintenance   { maintenance, message }     → everyone
 * The connection is recreated when the access token changes (refresh rotation) and closed on
 * logout. Reconnection is handled by socket.io-client.
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { accessToken, user } = useSelector((state) => state.auth)
  const signedIn = !!(accessToken && user)

  useEffect(() => {
    if (!signedIn) {
      setSocket(null)
      setIsConnected(false)
      return undefined
    }

    const next = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    next.on('connect', onConnect)
    next.on('disconnect', onDisconnect)
    setSocket(next)

    return () => {
      next.off('connect', onConnect)
      next.off('disconnect', onDisconnect)
      next.disconnect()
    }
  }, [signedIn, accessToken])

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
}

/** → { socket (null while signed out / connecting), isConnected } */
export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export default SocketContext
