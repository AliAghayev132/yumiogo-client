// SEO
import { Helmet } from 'react-helmet-async'

const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173'
const SITE_NAME = 'Starter'
const DEFAULT_TITLE = 'Starter — Fullstack Template'
const DEFAULT_DESCRIPTION =
  'A generic fullstack starter template built with React, Vite, Redux Toolkit and Tailwind CSS.'
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
  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
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
