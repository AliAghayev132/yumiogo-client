# constants/

## Məqsəd
Bu qovluq tətbiq boyu paylaşılan statik siyahıları və uyğunluq (mapping) cədvəllərini saxlayır: select-lər üçün `statusOptions` və `roleOptions`, həmçinin status dəyərini Badge variantına çevirən `statusBadgeVariant`. Bu dəyərlər serverdəki enum-larla (`server/constants/shared/enums.js`) sinxron saxlanmalıdır ki, client və server eyni sözlüklə işləsin.

## Adlandırma / yazılış konvensiyası
Adi JS modulu — JSX yoxdur. İxraclar camelCase adlı `export const`-lardır. Select siyahıları `{ value, label }` obyektlərindən ibarət massivlər kimi yazılır. Hazırda bütün sabitlər tək `index.js` barrel faylında yaşayır; idxal `@constants` alias-ı ilə aparılır.

## Nümunə
`index.js` içindən:
```js
export const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

export const statusBadgeVariant = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
}
```
İstifadə:
```js
import { statusOptions, statusBadgeVariant } from '@constants'
```

## Yeni fayl necə əlavə olunur
Hazırda bütün sabitlər `index.js`-də saxlanılır, ona görə əksər hallarda yeni fayl yaratmaq lazım deyil — sadəcə `index.js`-ə yeni `export const` əlavə et. Əgər qrup böyüyürsə, mövzuya görə ayrıca fayl yarat (məs. `postConstants.js`), oradan adlı ixrac ver və `index.js`-ə `export * from './postConstants'` sətrini əlavə et ki, `@constants` girişi qorunsun. Dəyərləri həmişə uyğun server enum-u ilə sinxron saxla.
