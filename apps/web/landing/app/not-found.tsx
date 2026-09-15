import Link from 'next/link';
import { Brandmark } from '@/components/Brandmark';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
      <Brandmark />
      <h1 className="font-display text-3xl font-bold text-bone">This road leads nowhere</h1>
      <p className="max-w-sm text-sm text-mist">
        The page you were looking for doesn&apos;t exist. Head back to pick your role.
      </p>
      <Link
        href="/"
        className="rounded-full bg-azure px-7 py-3 text-sm font-bold text-white shadow-azure transition-colors hover:bg-azure-soft"
      >
        Back to AutoMate
      </Link>
    </main>
  );
}
