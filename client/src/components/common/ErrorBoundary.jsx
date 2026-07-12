import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen grid place-items-center bg-slate-50 p-6">
          <section className="max-w-lg w-full rounded-xl border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-red-700">This screen could not load</h1>
            <p className="mt-2 text-sm text-slate-600">Refresh the page. If the problem continues, copy this message for support:</p>
            <pre className="mt-4 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-red-200">{this.state.error.message}</pre>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
