import './globals.css'

/** Unsplash — two people in conversation (free to use under Unsplash License). */
const CONVERSATION_BG =
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1920&q=80&auto=format&fit=crop'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="relative min-h-screen">
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat grayscale"
          style={{ backgroundImage: `url('${CONVERSATION_BG}')` }}
          aria-hidden
        />
        <div
          className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-br from-white/88 via-teal-50/82 to-cyan-100/80"
          aria-hidden
        />
        <main className="relative z-10 min-h-screen">{children}</main>
      </body>
    </html>
  )
}