import { Link } from 'react-router'
import { ArrowRight, Boxes, ShieldCheck, Zap } from 'lucide-react'
import { SEO } from '@components'

const features = [
  {
    icon: Boxes,
    title: 'Batteries included',
    description:
      'Redux Toolkit Query, routing, auth flow, UI kit and a real-time socket layer wired up out of the box.',
  },
  {
    icon: ShieldCheck,
    title: 'Auth ready',
    description:
      'Login, OTP register, token refresh and role-based route guards following a shared API contract.',
  },
  {
    icon: Zap,
    title: 'Fast by default',
    description:
      'Vite build, lazy-loaded route groups and manual vendor chunking for snappy loads.',
  },
]

export const HomePage = () => {
  return (
    <>
      <SEO title="Home" path="/" />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-6">
          Fullstack Starter Template
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight max-w-3xl mx-auto">
          Build your next product on a clean, generic foundation.
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          A React + Vite SPA wired to a matching Express/Mongoose API. Swap the example
          <span className="font-medium text-gray-900"> Post </span>
          resource for your own and ship.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="p-6 rounded-xl border border-gray-200 bg-white">
              <div className="w-11 h-11 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
