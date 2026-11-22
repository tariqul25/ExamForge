import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import RemoveNetlifyBadge from '@/components/RemoveNetlifyBadge';

export const metadata: Metadata = {
  title: 'ExamForge | Smart Competitive Job Preparation & Smart Exam Platform',
  description:
    'Competitive job preparation and smart exam platform. Upload textbook pages or notes, or generate instantly by topic for Bangla, English, Mathematics, General Knowledge, and IT. Take interactive MCQ or written exams with detailed explanations.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="flex flex-col min-h-screen antialiased font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
          <AuthModal />
          <RemoveNetlifyBadge />
        </AuthProvider>
      </body>
    </html>
  );
}
