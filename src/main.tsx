import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isBackendConfigured, onUnauthorized } from './lib/api';
import { queryKeys } from './queries/keys';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { router } from './routes';
import './index.css';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: isBackendConfigured ? 60_000 : Infinity,
      gcTime: isBackendConfigured ? 5 * 60_000 : Infinity,
      retry: isBackendConfigured ? 1 : false,
      refetchOnWindowFocus: false,
    },
  },
});

onUnauthorized(() => {
  queryClient.setQueryData(queryKeys.session, null);
  queryClient.removeQueries({ queryKey: ['mis'] });
  queryClient.removeQueries({ queryKey: ['ssc'] });
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
       <ReactQueryDevtools initialIsOpen={false} />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
