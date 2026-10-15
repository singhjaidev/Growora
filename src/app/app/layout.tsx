import { AppShell } from '@/components/app/shell';
import './app.css';
import './design.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'workspace',
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
