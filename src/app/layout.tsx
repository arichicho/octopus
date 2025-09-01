import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Octopus - Sistema de Gestión de Tareas",
  description: "Sistema completo de gestión de tareas multi-empresa con integraciones avanzadas",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/octopus-icon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3B82F6',
};

// Componente de versión visible
       function VersionIndicator() {
         const version = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
         const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
         const deployTime = new Date().toISOString();
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
                   v{version} | {new Date(buildTime).toLocaleTimeString()} | {new Date(deployTime).toLocaleTimeString()}
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
        <VersionIndicator />
      </body>
    </html>
  );
}
