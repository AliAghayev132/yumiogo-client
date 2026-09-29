import { createContext, useContext, useEffect, useState } from 'react'

export const HeaderSearchContext = createContext(null)

/**
 * useHeaderSearch() — connect the current page's list search to the global header search box
 * (Figma tabbar-section "Search bar"). While the page is mounted the header box searches it;
 * the query resets when the page unmounts.
 *
 *   const search = useHeaderSearch({ placeholder: 'Search users' })   // debounced string
 *   const { data } = useGetUsersQuery({ page, search })
 *   useEffect(() => setPage(1), [search])                             // or reset in a handler
 *
 * Options: placeholder, debounce (ms, 300). Outside the dashboard layout it returns ''.
 */
export const useHeaderSearch = ({ placeholder = 'Search', debounce = 300 } = {}) => {
  const ctx = useContext(HeaderSearchContext)
  const register = ctx?.register
  const query = ctx?.query ?? ''
  const [debounced, setDebounced] = useState(query)

  useEffect(() => {
    if (!register) return undefined
    return register({ placeholder })
  }, [register, placeholder])

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), query ? debounce : 0)
    return () => clearTimeout(t)
  }, [query, debounce])

  return debounced
}
