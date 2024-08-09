import React, { Suspense } from 'react';
import { ConfigProvider, Spin, theme } from 'antd';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';

import { MainError } from './components/main-error.tsx';
import { router } from './router';

import './i18n';
import './assets/styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center">
          <Spin size="large" />
        </div>
      }
    >
      <ErrorBoundary FallbackComponent={MainError}>
        <HelmetProvider>
          <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
            <RouterProvider router={router} />
          </ConfigProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </Suspense>
  </React.StrictMode>
);
