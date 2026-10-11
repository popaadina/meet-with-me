import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hai să vorbim',
  description: 'Programează o discuție: alege un moment sub cerul care ți se potrivește.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
