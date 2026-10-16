import React, { Suspense } from 'react';
import { App, ConfigProvider, Spin, theme } from 'antd';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';

import { MainError } from './components/main-error.tsx';
import { router } from './router';

import './i18n';
import './assets/styles/index.css';

const renderApp = () => {
  const themeConfig = {
    algorithm: theme.darkAlgorithm,
    components: {
      Collapse: {
        headerPadding: 0,
        contentPadding: 0
      }
    }
  };

  return ReactDOM.createRoot(document.getElementById('root')!).render(
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
            <ConfigProvider theme={themeConfig}>
              {/* Ant Design renders dialogs opened through its static helpers
                  in their own root: without App they fall back to the light
                  theme, which is why a confirm used to look out of place. */}
              <App>
                <RouterProvider router={router} />
              </App>
            </ConfigProvider>
          </HelmetProvider>
        </ErrorBoundary>
      </Suspense>
    </React.StrictMode>
  );
};

if (import.meta.env.MODE === 'mocked') {
  const { worker } = await import('./mocks/browser');
  worker.start().then(() => {
    return renderApp();
  });
}

renderApp();
