import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ThemeProvider } from "./context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZIGChain Explorer",
  description: "Explore the ZIGChain blockchain - blocks, transactions, validators, and more",
  icons: {
    icon: '/favicon.ico',
    apple: '/images/zigchain-icon.png',
    shortcut: '/images/zigchain-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Always force dark mode
                document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                console.log('Dark theme applied');
              } catch (_) {
                console.error('Error setting initial theme');
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-900 text-gray-200`}>
        <ThemeProvider>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
