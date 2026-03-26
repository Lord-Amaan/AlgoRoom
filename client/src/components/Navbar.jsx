import { UserButton } from '@clerk/clerk-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-[#dfe6f2] bg-[#f8fbff] flex items-center justify-between px-6">
      <div className="text-lg font-semibold tracking-tight text-[#233c5e]">Strategy Workspace</div>
      <div className="flex items-center gap-4">
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              userButtonPopoverFooter: "hidden",
            },
          }}
        />
      </div>
    </header>
  );
}
