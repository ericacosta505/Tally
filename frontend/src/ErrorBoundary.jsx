import React from 'react';
export default class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main style={{ maxWidth: 500, margin: '15vh auto', padding: 30 }}>
          <h1>Let’s get back to clarity.</h1>
          <p style={{ lineHeight: 1.8, marginBottom: 24 }}>
            Something interrupted your workspace. Your saved data is still here.
          </p>
          <button className="button primary" onClick={() => window.location.reload()}>
            Reload Tally
          </button>
        </main>
      );
    return this.props.children;
  }
}
