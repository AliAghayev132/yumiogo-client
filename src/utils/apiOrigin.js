/**
 * Origin of the Yumio API (no trailing slash, without /api). One place for every caller:
 * RTK Query (store/api/baseApi), image URLs (getImageUrl) and Socket.IO (SocketContext).
 *
 * Empty (the default) = the site's own origin:
 *  - production: nginx serves the admin and proxies /api, /uploads and /socket.io to the server;
 *  - `npm run dev`: Vite proxies the same paths to the local server (vite.config.js,
 *    API_PROXY_TARGET, default http://localhost:3042).
 * Set VITE_API_URL only to call an API on another origin directly (it must allow CORS).
 * `||` on purpose: an empty VITE_API_URL= in .env means "unset".
 */
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

/** Base URL of the REST API. */
export const API_BASE_URL = `${API_ORIGIN}/api`
