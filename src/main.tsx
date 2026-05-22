import React, { StrictMode, Component, ReactNode, ErrorInfo } from 'react';
import {createRoot} from 'react-dom/client';

// Safe global process mockup for client-side static environments (e.g. Vercel)
if (typeof window !== 'undefined') {
  const g = window as any;
  g.process = g.process || {};
  g.process.env = g.process.env || {};
  if (typeof g.process.env.GEMINI_API_KEY === 'undefined') {
    g.process.env.GEMINI_API_KEY = '';
  }
}

import App from './App.tsx';
import './index.css';

console.log("CONNECTED");

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: '#333', background: '#fff', fontSize: 16 }}>
          <h1 style={{ color: 'red' }}>Runtime Error</h1>
          <p>O aplicativo encontrou um erro e não pôde carregar.</p>
          <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 5, overflow: 'auto' }}>
            {this.state.error?.message}
          </pre>
          <details style={{ marginTop: 10 }}>
            <summary>Detalhes técnicos</summary>
            <pre style={{ fontSize: 12 }}>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
