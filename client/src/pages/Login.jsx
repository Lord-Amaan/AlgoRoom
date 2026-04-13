import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            footer: 'hidden',
            footerAction: 'hidden',
            poweredByClerk: 'hidden',
          },
        }}
      />
    </div>
  );
}
