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
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#111827" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root { color-scheme: dark; }
          html { background-color: #111827 !important; }
          body { background-color: #111827 !important; color: #e5e7eb !important; }
        `}} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Always force dark mode
                document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', 'dark');
                document.documentElement.style.colorScheme = 'dark';
                localStorage.setItem('theme', 'dark');
                
                // Create a MutationObserver to ensure dark mode is never removed
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class' && !document.documentElement.classList.contains('dark')) {
                      document.documentElement.classList.add('dark');
                    }
                    if (mutation.attributeName === 'data-theme' && document.documentElement.getAttribute('data-theme') !== 'dark') {
                      document.documentElement.setAttribute('data-theme', 'dark');
                    }
                  });
                });
                
                observer.observe(document.documentElement, { attributes: true });
                console.log('Dark theme enforced with observer');
              } catch (error) {
                console.error('Error setting initial theme:', error);
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
