import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setupAxiosInterceptor } from '../services/api';

export function useClerkAxios() {
  const { getToken } = useAuth();

  useEffect(() => {
    // Start request interceptor once auth is ready.
    const cleanup = setupAxiosInterceptor(getToken);

    return cleanup;
  }, [getToken]);
}
