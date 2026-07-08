# utils/

## Məqsəd

Bu qovluq tətbiqin hər yerində istifadə oluna bilən, state-dən asılı olmayan saf (pure) köməkçi funksiyaları saxlayır. Hazırda burada `formatDate.js` (tarix formatlaması — `date-fns` üzərində) və `imageHandle.js` (şəkil URL-lərinin qurulması və fayl yükləmə üçün `FormData` hazırlanması) var. `index.js` isə barrel-dir və bütün köməkçiləri bir nöqtədən ixrac edir ki, komponentlər tək `@utils` alias-ından import edə bilsin.

## Adlandırma / yazılış konvensiyası

- Fayllar mövzuya görə camelCase adlanır (`formatDate.js`, `imageHandle.js`) — bir fayl bir mövzunu əhatə edir.
- Funksiyalar named export edilir (`export const ...`); default export istifadə olunmur.
- Funksiyalar saf olmalıdır: yan təsirsiz, React / Redux-dan asılı olmadan.
- `index.js` yalnız `export * from './<fayl>'` sətirlərindən ibarət barrel-dir.
- Alias-lar: `@utils` -> `src/utils/index.js` (barrel), `@utils/*` -> ayrıca fayl.

## Nümunə

`formatDate.js` faylından:

```js
import { format, isValid } from 'date-fns'

export const formatDate = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (!isValid(date)) return ''
  return format(date, 'dd.MM.yyyy')
}
```

Komponentdə barrel və alias ilə: `import { formatDate } from '@utils'`.

## Yeni fayl necə əlavə olunur

1. `<mövzu>.js` faylı yarat (məs. `formatCurrency.js`).
2. Köməkçiləri named export ilə yaz: `export const formatCurrency = (...) => { ... }`.
3. Funksiyanı saf saxla — React / Redux-a bağlama.
4. `index.js` barrel-inə `export * from './<mövzu>'` sətrini əlavə et.
5. İstifadə: `import { formatCurrency } from '@utils'`.
