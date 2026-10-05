import { Dashboard } from '@/components/product/dashboard';
export const metadata = { title: 'Workspace overview' };
export default function Page() {
  return (
    <>
      <h1 className="sr-only">Workspace overview</h1>
      <Dashboard />
    </>
  );
}
