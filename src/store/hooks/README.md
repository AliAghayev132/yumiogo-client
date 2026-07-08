# store/hooks/

## Məqsəd

Bu qovluq store / context ilə əlaqəli təkrar istifadə olunan custom React hook-larını saxlayır. Hazırda burada `useRoomSocket.js` var — o, `@store/context`-dəki `useSocket`-in üzərində qurulur, komponent mount olanda otağa qoşulur, gələn real-time hadisələri (`message:new`, `user:typing`, ...) callback-lərə ötürür və unmount olanda otağı tərk edir. Beləliklə komponentlər socket detallarını bilmədən yalnız hook-u çağırır.

## Adlandırma / yazılış konvensiyası

- Hər hook `use` prefiksi ilə camelCase adlanır və fayl adı hook adı ilə eynidir: `useXxx.js`.
- Fayl həm named export (`export const useXxx = ...`) həm də `export default useXxx` verir.
- Hook-lar mövcud context/store hook-larını (məs. `useSocket`) `@store/context` alias-ı ilə istehlak edir.
- Yan təsirlər `useEffect` daxilində qurulur və cleanup funksiyasında geri götürülür (event `.off`, otaqdan çıxış).
- `index.js` barrel-dir və hər hook-u yenidən ixrac edir.

## Nümunə

`useRoomSocket.js` faylından:

```js
import { useSocket } from '@store/context'

export const useRoomSocket = (roomId, options = {}) => {
  const { socket, isConnected, joinRoom, leaveRoom } = useSocket()
  useEffect(() => {
    if (!socket || !isConnected || !roomId) return
    joinRoom(roomId)
    return () => leaveRoom(roomId)
  }, [socket, isConnected, roomId])
  return { isConnected, handleTyping }
}
```

Komponentdə barrel ilə: `import { useRoomSocket } from '@store/hooks'`.

## Yeni fayl necə əlavə olunur

1. `useXxx.js` faylı yarat, hook-u `export const useXxx = (...) => { ... }` kimi yaz.
2. Lazımi context/store hook-larını `@store/...` alias-ı ilə import et.
3. Yan təsirləri `useEffect` + cleanup ilə idarə et.
4. Faylın sonunda `export default useXxx` əlavə et.
5. `index.js` barrel-inə `export { useXxx } from './useXxx'` sətrini əlavə et.
