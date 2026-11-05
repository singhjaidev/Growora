import { Logo } from '@/components/ui';
import { JoinForm } from '@/components/workspace/forms';
import w from '@/components/workspace/workspace.module.css';
export const metadata = {
  title: 'Workspace invitation',
  referrer: 'no-referrer' as const,
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main id="main" className={w.join}>
      <div>
        <Logo />
        <h1>Workspace invitation</h1>
        <JoinForm />
      </div>
    </main>
  );
}
