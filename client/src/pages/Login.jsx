import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    // call login(email, password)
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="bg-dark-900 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Algoroom</h1>
        <h2 className="text-xl text-dark-300 text-center mb-8">Sign in to your account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-dark-800 rounded-lg border border-dark-700 focus:border-primary-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-dark-800 rounded-lg border border-dark-700 focus:border-primary-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition"
          >
            Sign In
          </button>
        </form>
        <p className="text-center text-dark-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-400 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
