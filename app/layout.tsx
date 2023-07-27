import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Function Calling",
  description: "Function Calling",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          {/* ヘッダー */}
          <header className="sticky top-0 border-b mb-5 bg-white z-10">
            <div className="h-16 container mx-auto max-w-screen-md px-5 flex items-center">
              <div className="font-bold text-lg">FullStackChannel</div>
            </div>
          </header>

          {/* トースト */}
          <Toaster />

          <main className="container mx-auto max-w-screen-md flex-1 px-5">
            {children}
          </main>

          {/* フッター */}
          <footer className="py-5 fixed bottom-0 inset-x-0 bg-white">
            <div className="text-center text-sm">
              Copyright © All rights reserved | FullStackChannel
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
