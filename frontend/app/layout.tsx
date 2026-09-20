import type { Metadata } from 'next';
import { Geist, Geist_Mono, Quicksand } from 'next/font/google';
import { Sidebar } from '@/components/Sidebar';
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

const quicksand = Quicksand({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: 'Plataforma de Chamados',
  description: 'Registro, acompanhamento e resolução de ocorrências em condomínios.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable}`}>
      <body>
        <AuthProvider>
          <div className="app-shell">
            <Sidebar />
            <div className="app-content">
              <main>{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
