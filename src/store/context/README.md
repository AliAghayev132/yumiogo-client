# store/context/

`SocketContext.jsx` — `SocketProvider` opens one authenticated Socket.IO connection while an admin
is signed in (recreated when the access token rotates, closed on logout); `useSocket()` returns
`{ socket, isConnected }`. The server only pushes (see `server/services/SocketService.js`):
`admin:alert`, `notification:new`, `account:status`, `app:maintenance`. The admin reacts to them
in `store/hooks/useAdminLiveUpdates.js`.
