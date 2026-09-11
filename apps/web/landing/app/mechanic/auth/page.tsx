import type { Metadata } from 'next';
import { APP_NAME, getRole } from '@automate/shared-brand';
import { AuthHandoff } from '@/components/AuthHandoff';

const role = getRole('mechanic')!;

export const metadata: Metadata = {
  title: `${APP_NAME} — ${role.label} sign in`,
  description: role.description,
};

export default function MechanicAuthPage() {
  return <AuthHandoff roleId="mechanic" />;
}
