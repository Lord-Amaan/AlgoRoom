import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setupAxiosInterceptor } from '../services/api';

export function useClerkAxios() {
  const { getToken } = useAuth();

  useEffect(() => {
    setupAxiosInterceptor(getToken);
  }, [getToken]);
}
