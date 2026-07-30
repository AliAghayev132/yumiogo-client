/* This file intentionally exports a hook (useSocket) alongside the provider,
   and the connection effect drives an external system (Socket.IO) so it must
   call setState synchronously to store/tear down the socket instance. */
/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { useSelector } from 'react-redux'

const SocketContext = createContext(null)

// Production: same origin as the site (socket.io defaults to it when undefined).
// Development: the local API server. Override with VITE_API_URL.
const SOCKET_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3042' : undefined)

// Provides a single authenticated Socket.IO connection to the whole app.
// The connection is (re)created whenever the auth token / user changes and is
// torn down on logout. Reconnection is handled by socket.io-client.
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { accessToken, user } = useSelector((state) => state.auth)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    // No session -> ensure any existing socket is closed.
    if (!accessToken || !user) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      reconnectAttempts.current = 0
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('connect_error', () => {
      reconnectAttempts.current++
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user])

  // ---- Generic room helpers (server: join:room / leave:room / typing / message) ----
  const joinRoom = useCallback(
    (roomId) => {
      if (socket && isConnected) socket.emit('join:room', roomId)
    },
    [socket, isConnected]
  )

  const leaveRoom = useCallback(
    (roomId) => {
      if (socket && isConnected) socket.emit('leave:room', roomId)
    },
    [socket, isConnected]
  )

  const startTyping = useCallback(
    (roomId) => {
      if (socket && isConnected) socket.emit('typing:start', roomId)
    },
    [socket, isConnected]
  )

  const stopTyping = useCallback(
    (roomId) => {
      if (socket && isConnected) socket.emit('typing:stop', roomId)
    },
    [socket, isConnected]
  )

  const sendMessage = useCallback(
    (roomId, message) => {
      if (socket && isConnected) socket.emit('message:new', { roomId, message })
    },
    [socket, isConnected]
  )

  const value = {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    sendMessage,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export default SocketContext
