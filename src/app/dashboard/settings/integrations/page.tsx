import { noStore } from 'next/cache';
import IntegrationsClient from './IntegrationsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function IntegrationsSettingsPage() {
  noStore();
  return <IntegrationsClient />;
}
