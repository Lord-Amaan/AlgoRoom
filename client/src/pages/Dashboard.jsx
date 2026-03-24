import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Dashboard() {
  const [authStatus, setAuthStatus] = useState('Checking auth bootstrap...');

  useEffect(() => {
    let isMounted = true;

    const fetchMe = async () => {
      try {
        const response = await api.get('/auth/me');
        if (isMounted) {
          setAuthStatus(`Connected as ${response.data?.userId || 'unknown user'}`);
        }
      } catch (error) {
        if (isMounted) {
          setAuthStatus(error.response?.data?.message || 'Failed to reach /api/auth/me');
        }
      }
    };

    fetchMe();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-dark-400">Portfolio overview, equity curve, active strategies, and recent trades.</p>
      <p className="text-sm mt-3">Auth status: {authStatus}</p>
    </div>
  );
}
