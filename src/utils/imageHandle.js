const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Upload directory paths (mirrors server/constants/shared/paths.js).
 */
export const uploadPaths = {
  avatars: 'uploads/avatars',
  posts: 'uploads/posts',
}

/**
 * Get a full image URL from a stored relative path.
 * @param {string} relativePath - e.g. "uploads/posts/abc123.png"
 * @returns {string}
 */
export const getImageUrl = (relativePath) => {
  if (!relativePath) return ''
  if (relativePath.startsWith('http')) return relativePath
  return `${API_URL}/${relativePath}`
}

/**
 * Get an image URL for a specific upload folder.
 * @param {keyof typeof uploadPaths} folder - e.g. 'avatars', 'posts'
 * @param {string} filename
 * @returns {string}
 */
export const getImageUrlFor = (folder, filename) => {
  if (!filename) return ''
  const dir = uploadPaths[folder]
  if (!dir) return ''
  return `${API_URL}/${dir}/${filename}`
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
