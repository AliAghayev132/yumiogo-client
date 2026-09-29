import { API_ORIGIN } from './apiOrigin'

/**
 * Upload directory paths (mirrors server/constants/shared/paths.js).
 */
export const uploadPaths = {
  avatars: 'uploads/avatars',
  restaurants: 'uploads/restaurants',
  reviews: 'uploads/reviews',
  catalog: 'uploads/catalog',
  content: 'uploads/content',
}

/**
 * Get a full image URL from a stored relative path (remote http(s) URLs pass through).
 * @param {string} relativePath - e.g. "uploads/restaurants/abc123.png"
 * @returns {string}
 */
export const getImageUrl = (relativePath) => {
  if (!relativePath) return ''
  if (relativePath.startsWith('http') || relativePath.startsWith('blob:') || relativePath.startsWith('data:')) {
    return relativePath
  }
  return `${API_ORIGIN}/${relativePath.replace(/^\/+/, '')}`
}

/**
 * Get an image URL for a specific upload folder.
 * @param {keyof typeof uploadPaths} folder - e.g. 'avatars', 'restaurants'
 * @param {string} filename
 * @returns {string}
 */
export const getImageUrlFor = (folder, filename) => {
  if (!filename) return ''
  const dir = uploadPaths[folder]
  if (!dir) return ''
  return `${API_ORIGIN}/${dir}/${filename}`
}

/**
 * Build a FormData payload for a single-file upload.
 * @param {File} file
 * @param {string} fieldName - Form field name (default: 'file')
 * @param {Object} extraFields - Additional fields to append
 * @returns {FormData}
 */
export const createFileFormData = (file, fieldName = 'file', extraFields = {}) => {
  const fd = new FormData()
  fd.append(fieldName, file)
  Object.entries(extraFields).forEach(([key, value]) => {
    fd.append(key, value)
  })
  return fd
}
