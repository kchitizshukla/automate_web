/* "Wrong door?" escape hatch shown under the auth forms. */

import { ROLE_SELECT_URL } from '@/lib/landing';

export function SwitchRoleLink({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-xs text-slate-400 ${className}`}>
      Not an <span className="font-medium text-slate-500">Admin</span>?{' '}
      <a
        href={ROLE_SELECT_URL}
        className="font-semibold text-brand underline-offset-4 hover:underline"
      >
        Choose a different role
      </a>
    </p>
  );
}
