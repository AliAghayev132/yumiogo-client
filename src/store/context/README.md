# store/context/

## Məqsəd

Bu qovluq RTK Query / Redux ilə idarə olunmayan, davamlı (long-lived) kənar sistemləri React Context vasitəsilə bütün tətbiqə çatdırır. Hazırda burada `SocketContext.jsx` var — o, bütün tətbiq üçün tək autentifikasiya olunmuş Socket.IO bağlantısı yaradır, auth token / user dəyişəndə bağlantını yenidən qurur və logout zamanı bağlayır. `index.js` barrel-dir və provider ilə hook-u bir nöqtədən ixrac edir.

## Adlandırma / yazılış konvensiyası

- Context faylları `<Ad>Context.jsx` şəklində PascalCase adlanır (JSX qaytardığına görə `.jsx`).
- Hər fayl bir `Provider` komponenti (`<Ad>Provider`) və ona uyğun `use<Ad>` consumer hook-u ixrac edir.
- `use<Ad>` hook-u provider xaricində çağırılanda mənalı `Error` atmalıdır.
- Xarici sistemin state-i (məs. socket) Redux-da yox, `useState`/`useRef` ilə context daxilində saxlanılır.
- Barrel `index.js` yalnız provider və hook-u yenidən ixrac edir.

## Nümunə

`SocketContext.jsx` faylından:

```jsx
const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const { accessToken, user } = useSelector((state) => state.auth)
  // ... token dəyişəndə io(SOCKET_URL, { auth: { token } }) qurulur
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) throw new Error('useSocket must be used within a SocketProvider')
  return context
}
```

İstifadə: `@store/context` barrel-i ilə `import { SocketProvider, useSocket } from '@store/context'`.

## Yeni fayl necə əlavə olunur

1. `<Ad>Context.jsx` yarat, `createContext(null)` ilə context obyekti qur.
2. `<Ad>Provider` komponentini və qorunan `use<Ad>` hook-unu ixrac et.
3. `index.js` barrel-inə `export { <Ad>Provider, use<Ad> } from './<Ad>Context'` əlavə et.
4. Provider-i tətbiqin kökündə (App/router) mövcud provider ağacına daxil et.
