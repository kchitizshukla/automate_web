import type { Metadata } from 'next';
import { APP_NAME, getRole } from '@automate/shared-brand';
import { AuthHandoff } from '@/components/AuthHandoff';

const role = getRole('admin')!;

export const metadata: Metadata = {
  title: `${APP_NAME} — ${role.label} sign in`,
  description: role.description,
};

export default function AdminAuthPage() {
  return <AuthHandoff roleId="admin" />;
}
