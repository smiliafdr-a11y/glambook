import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GlamBook — La plateforme beauté',
  description: 'Réservez votre prestataire beauté en ligne. Acomptes, liste d\'attente, notifications automatiques.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
