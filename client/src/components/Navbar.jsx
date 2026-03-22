import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-dark-900 border-b border-dark-800 flex items-center justify-between px-6">
      <div className="text-lg font-semibold">Algoroom</div>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-dark-400 text-sm">{user.name || user.email}</span>
            <button
              onClick={logout}
              className="text-sm text-dark-400 hover:text-white transition"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
