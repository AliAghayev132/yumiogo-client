// SEO
import { Helmet } from 'react-helmet-async'

// Canonical / Open Graph origin: VITE_SITE_URL, else wherever the site is served from.
const SITE_URL =
  import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://yumiogo.com')
const SITE_NAME = 'Yumio'
const DEFAULT_TITLE = 'Yumio Admin'
const DEFAULT_DESCRIPTION = 'Yumio admin panel — manage users, restaurants, reviews and reports.'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

// Per-page <head> tags. Renders title, description, canonical, Open Graph and
// Twitter cards. Wrap the app in <HelmetProvider> (see App.jsx).
export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  path = '',
  noindex = false,
}) => {
  // "Users | Yumio"; titles that already carry the brand are used as-is.
  const pageTitle = title ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`) : DEFAULT_TITLE
  const url = `${SITE_URL}${path}`

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
