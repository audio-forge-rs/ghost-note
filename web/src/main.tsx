import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { analyticsService } from '@/lib/analytics'

// Initialize analytics service early (before React renders)
// This respects Do Not Track and provides privacy-first analytics
analyticsService.initialize();

// Set up global error handler to catch uncaught errors
window.addEventListener('error', (event) => {
  analyticsService.trackError(event.error || event.message, {
    component: 'window',
    caught: false,
    isReactError: false,
  });
});

// Set up unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason instanceof Error
    ? event.reason.message
    : String(event.reason);
  analyticsService.trackError(message, {
    component: 'promise',
    caught: false,
    isReactError: false,
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
