import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import ThemeRegistry from '@/components/common/ThemeRegistry';
import ReactQueryProvider from '@/components/common/ReactQueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import "./globals.css";

// Fuente para títulos y navegación - Montserrat
const montserrat = Montserrat({
  variable: "--font-montserrat-custom",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Fuente para texto de cuerpo - Open Sans
const openSans = Open_Sans({
  variable: "--font-opensans-custom",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Asociación de Judo",
  description: "Sistema de gestión para asociación de judo",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${openSans.variable} antialiased`}
        suppressHydrationWarning
      >
        <ReactQueryProvider>
          <ThemeRegistry>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeRegistry>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
