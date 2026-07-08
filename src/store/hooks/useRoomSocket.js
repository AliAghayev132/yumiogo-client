import { useEffect, useCallback, useRef } from 'react'
import { useSocket } from '@store/context'

/**
 * Generic real-time room hook.
 *
 * Example pattern for subscribing a component to a room's events. Join the room
 * on mount, forward incoming events to optional callbacks, and leave on unmount.
 * Copy this file and adapt the event names when building a real feature (chat,
 * live post comments, notifications, ...).
 *
 * @param {string} roomId - Identifier of the room to join.
 * @param {object} options - Optional event callbacks.
 * @param {(data:any)=>void} [options.onMessage]
 * @param {(data:any)=>void} [options.onUserTyping]
 * @param {(data:any)=>void} [options.onUserStoppedTyping]
 */
export const useRoomSocket = (roomId, options = {}) => {
  const { socket, isConnected, joinRoom, leaveRoom, startTyping, stopTyping } = useSocket()
  const typingTimeoutRef = useRef(null)
  const { onMessage, onUserTyping, onUserStoppedTyping } = options

  useEffect(() => {
    if (!socket || !isConnected || !roomId) return

    joinRoom(roomId)

    const handleMessage = (data) => {
      if (data.roomId === roomId) onMessage?.(data)
    }
    const handleUserTyping = (data) => {
      if (data.roomId === roomId) onUserTyping?.(data)
    }
    const handleUserStoppedTyping = (data) => {
      if (data.roomId === roomId) onUserStoppedTyping?.(data)
    }

    socket.on('message:new', handleMessage)
    socket.on('user:typing', handleUserTyping)
    socket.on('user:stopped_typing', handleUserStoppedTyping)

    return () => {
      leaveRoom(roomId)
      socket.off('message:new', handleMessage)
      socket.off('user:typing', handleUserTyping)
      socket.off('user:stopped_typing', handleUserStoppedTyping)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, roomId])

  // Debounced typing indicator: emit start immediately, stop after idle.
  const handleTyping = useCallback(() => {
    if (!roomId) return
    startTyping(roomId)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => stopTyping(roomId), 2000)
  }, [roomId, startTyping, stopTyping])

  return { isConnected, handleTyping }
}

export default useRoomSocket
