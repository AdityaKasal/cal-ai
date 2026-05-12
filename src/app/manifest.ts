import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cal AI — Calorie Tracker',
    short_name: 'Cal AI',
    description: 'Snap a photo of your food and get instant AI-powered nutritional analysis',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    background_color: '#020617',
    theme_color: '#10b981',
    orientation: 'portrait',
    lang: 'en',
    dir: 'ltr',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        // @ts-expect-error form_factor is valid but not yet in Next.js types
        form_factor: 'narrow',
        label: 'Cal AI home screen',
      },
    ],
  }
}
