import type { Metadata } from 'next';
import { Baloo_2, Google_Sans_Flex } from 'next/font/google';
import { Sidebar } from '@/components/Sidebar';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

const googleSansFlex = Google_Sans_Flex({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const baloo2 = Baloo_2({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'CondoFácil',
  description: 'Registro, acompanhamento e resolução de ocorrências em condomínios.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${googleSansFlex.variable} ${baloo2.variable}`}>
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
