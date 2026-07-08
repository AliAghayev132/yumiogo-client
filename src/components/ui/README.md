# components/ui/

## Məqsəd
Bu qovluq tətbiqin təqdimat (presentational) UI kitidir — domenə bağlı olmayan, yenidən istifadə edilən primitivlər. Fayllar: `Badge`, `Button`, `Card`, `Checkbox`, `CustomSelect`, `Input`, `Modal`, `PageLoader`, `Radio`, `Select`, `StatCard`, `Table`, `Textarea`. Hamısı Tailwind CSS ilə stillənir və `clsx` vasitəsilə şərti class-ları birləşdirir.

## Adlandırma / yazılış konvensiyası
Hər primitiv PascalCase `.jsx` faylıdır və `export const` ilə adlı ixrac verir. Görünüş `variant`/`size` prop-ları ilə idarə olunur; bunların Tailwind class-ları komponent daxilində `variants`/`sizes` obyektlərində saxlanılır. `index.js` barrel-ı hər primitivi `export * from './Name'` ilə yenidən ixrac edir. Bu barrel öz növbəsində `components/index.js`-də `export * from './ui'` ilə birləşdirilir, ona görə idxal `@components` alias-ı ilə aparılır.

## Nümunə
`Button.jsx`:
```jsx
export const Button = ({ variant = 'primary', size = 'md', className, ...props }) => {
  const variants = { primary: 'bg-green-600 text-white hover:bg-green-700', /* ... */ }
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }
  return (
    <button className={clsx(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}
```
`ui/index.js`-də `export * from './Button'` var; istifadə: `import { Button } from '@components'`.

## Yeni fayl necə əlavə olunur
1. `ui/` içində PascalCase fayl yarat (məs. `Tooltip.jsx`), `clsx` idxal et və `export const Tooltip = (...) => { ... }` yaz.
2. Variantları `variants`/`sizes` obyektlərində saxla və `clsx(...)` ilə birləşdir.
3. `ui/index.js`-ə `export * from './Tooltip'` sətrini əlavə et.
4. Hər yerdən `import { Tooltip } from '@components'` ilə istifadə et.
