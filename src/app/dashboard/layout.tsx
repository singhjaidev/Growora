import { workspaceContext } from '@/server/workspace/context';
import { DashboardShell } from '@/components/dashboard/shell';
export const metadata = { title: 'Account dashboard', robots: { index: false, follow: false } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { actor, rows, active } = await workspaceContext();
  return (
    <DashboardShell name={actor.name} rows={rows} active={active?.id}>
      {children}
    </DashboardShell>
  );
}
