import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-teal-50 via-teal-100 to-cyan-100 min-h-screen">
        <main>{children}</main>
      </body>
    </html>
  )
}