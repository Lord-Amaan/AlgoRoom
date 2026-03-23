import { UserButton } from '@clerk/clerk-react';

export default function Navbar() {
  return (
    <header className="h-16 bg-dark-900 border-b border-dark-800 flex items-center justify-between px-6">
      <div className="text-lg font-semibold">Algoroom</div>
      <div className="flex items-center gap-4">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
