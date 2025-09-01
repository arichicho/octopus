import { noStore } from 'next/cache';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardPage() {
  noStore();
  return <DashboardClient />;
}

