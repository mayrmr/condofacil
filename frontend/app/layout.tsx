import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NavBar } from '@/components/NavBar';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Plataforma de Chamados',
  description: 'Registro, acompanhamento e resolução de ocorrências em condomínios.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>
          <NavBar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
