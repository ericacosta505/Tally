import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { monthLabel } from '../lib/finance';
import Icon, { Brand } from './Icon';
import Overview from './Overview';
import useLedger from './useLedger';
import { Transactions, Budgets, Recurring, Forecast } from './Views';
import { EntryDialog, SettingsDialog, CommandDialog, AboutDialog } from './Dialogs';
import './workspace.css';
const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'subscriptions', label: 'Recurring' },
  { id: 'forecast', label: 'Forecast' },
];
export default function Workspace() {
  const auth = useAuth();
  const router = useNavigate();
  const [params, setParams] = useSearchParams();
  const view = NAV.some((n) => n.id === params.get('view')) ? params.get('view') : 'overview';
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [mobileNav, setMobileNav] = useState(false);
  const sideRef = useRef(null);
  const menuRef = useRef(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const closeModal = useCallback(() => setModal(null), []);
  const notify = useCallback((message) => setToast(message), []);
  const onAdd = () => setModal({ type: 'entry' });
  const onEdit = (entry) => setModal({ type: 'entry', entry });
  const onSettings = () => setModal({ type: 'settings' });
  const ledger = useLedger(auth);
  const navigate = (next, filters = {}) => {
    setParams({ ...(next === 'overview' ? {} : { view: next }), ...filters });
    setMobileNav(false);
  };
  useEffect(() => {
    const viewport = window.matchMedia('(max-width: 700px)');
    const listener = (event) => {
      if (!event.matches) setMobileNav(false);
    };
    viewport.addEventListener('change', listener);
    return () => viewport.removeEventListener('change', listener);
  }, []);
  useEffect(() => {
    if (!mobileNav) return;
    const previous = document.activeElement;
    sideRef.current?.querySelector('a, button')?.focus();
    const close = (event) => {
      if (event.key === 'Escape') setMobileNav(false);
      if (event.key === 'Tab') {
        const items = Array.from(sideRef.current.querySelectorAll('a, button:not(:disabled)'));
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('keydown', close);
      previous?.focus?.();
    };
  }, [mobileNav]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const handler = (event) => {
      if (ledger.loading) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setModal((current) => (current?.type === 'command' ? null : { type: 'command' }));
      } else if (
        !modal &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        event.key.toLowerCase() === 'n' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) &&
        !event.target.isContentEditable
      ) {
        event.preventDefault();
        setModal({ type: 'entry' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modal, ledger.loading]);
  useEffect(() => {
    document.title = `${NAV.find((n) => n.id === view)?.label} · Tally`;
  }, [view]);
  return (
    <div className="workspace">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside
        ref={sideRef}
        id="workspace-navigation"
        className={`sidebar ${mobileNav ? 'is-open' : ''}`}
      >
        <Link className="brand-link" to="/">
          <Brand />
        </Link>
        <div className="workspace-switch">
          <span className="workspace-avatar">
            <Icon name="wallet" size={18} />
          </span>
          <div>
            <strong>Personal workspace</strong>
            <span>Make every dollar count</span>
          </div>
          <Icon name="chevronDown" size={14} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
            >
              <Icon name={item.id} />
              <span>{item.label}</span>
              {item.id === 'forecast' && <span className="new-badge">NEW</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-note">
            <span className="demo-note-icon">
              <Icon name="spark" size={20} />
            </span>
            <strong>
              {auth.isAuthenticated ? 'A little more intentional.' : 'Your space to explore.'}
            </strong>
            <p>
              {auth.isAuthenticated
                ? 'Small decisions today. More possibilities tomorrow.'
                : 'A demo with sample data. Make it your own, try things out.'}
            </p>
            {!auth.isAuthenticated && (
              <Link to="/signup">
                Create your workspace <Icon name="arrow" size={15} />
              </Link>
            )}
          </div>
          <button className="nav-item" disabled={ledger.loading} onClick={onSettings}>
            <Icon name="settings" />
            <span>Budget settings</span>
          </button>
          <button className="nav-item" onClick={() => setModal({ type: 'about' })}>
            <Icon name="help" />
            <span>About & shortcuts</span>
          </button>
          <div className="profile">
            <span className="profile-avatar">
              {auth.user ? `${auth.user.first_name[0]}${auth.user.last_name[0]}` : 'JD'}
            </span>
            <div>
              <strong>
                {auth.user ? `${auth.user.first_name} ${auth.user.last_name}` : 'Jamie Davis'}
              </strong>
              <span>{auth.isAuthenticated ? 'Personal account' : 'Demo workspace'}</span>
            </div>
            <button
              className="icon-button"
              title={auth.isAuthenticated ? 'Sign out' : 'Sign in'}
              onClick={() => {
                if (auth.isAuthenticated) auth.logout();
                else router('/login');
              }}
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className="workspace-main" inert={mobileNav ? '' : undefined}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              ref={menuRef}
              aria-expanded={mobileNav}
              aria-controls="workspace-navigation"
              className="icon-button mobile-menu"
              title="Open navigation"
              onClick={() => setMobileNav(true)}
            >
              <Icon name="menu" />
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>{NAV.find((n) => n.id === view)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <button className="search-launch" onClick={() => setModal({ type: 'command' })}>
              <Icon name="search" size={17} />
              <span>Search anything...</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="demo-badge">
              <span />
              {auth.isAuthenticated ? 'Your workspace' : 'Live demo'}
            </span>
          </div>
        </header>
        <main id="main" className="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</div>
              <h1>
                {view === 'overview'
                  ? 'Your money, in focus.'
                  : NAV.find((n) => n.id === view)?.label}
              </h1>
              <p>
                {view === 'overview'
                  ? `Welcome back, ${auth.user?.first_name || 'Jamie'}. Let’s make it a good month.`
                  : {
                      transactions: 'The details behind your day-to-day.',
                      budgets: 'A little structure. A lot of possibility.',
                      subscriptions: 'Know what keeps coming back.',
                      forecast: 'Make a little room for what’s next.',
                    }[view]}
              </p>
            </div>
            <div className="page-actions">
              {view !== 'subscriptions' && (
                <div className="month-picker">
                  <button
                    className="icon-button previous-month"
                    title="Previous month"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  >
                    <Icon name="chevron" size={13} />
                  </button>
                  <span>
                    <Icon name="calendar" size={15} />
                    {monthLabel(month)}
                  </span>
                  <button
                    className="icon-button"
                    title="Next month"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  >
                    <Icon name="chevron" size={13} />
                  </button>
                </div>
              )}
              <button className="button primary" disabled={ledger.loading} onClick={onAdd}>
                <Icon name="plus" size={17} /> Add transaction
              </button>
            </div>
          </div>
          {ledger.error && (
            <div className="error-banner" role="alert">
              {ledger.error}
              <button className="text-button" onClick={ledger.refresh}>
                Try again
              </button>
            </div>
          )}
          {ledger.loading ? (
            <div className="loading-state" role="status">
              <span className="loader" />
              Bringing your money into focus…
            </div>
          ) : (
            <div key={view} className="view-content">
              {view === 'overview' && (
                <Overview
                  ledger={ledger}
                  month={month}
                  navigate={navigate}
                  onEdit={onEdit}
                  onAdd={onAdd}
                  onSettings={onSettings}
                />
              )}
              {view === 'transactions' && (
                <Transactions
                  ledger={ledger}
                  month={month}
                  params={params}
                  setParams={setParams}
                  onEdit={onEdit}
                  onAdd={onAdd}
                  notify={notify}
                />
              )}
              {view === 'budgets' && (
                <Budgets
                  ledger={ledger}
                  month={month}
                  onSettings={onSettings}
                  navigate={navigate}
                />
              )}
              {view === 'subscriptions' && <Recurring ledger={ledger} navigate={navigate} />}
              {view === 'forecast' && <Forecast ledger={ledger} month={month} />}
            </div>
          )}
          <footer className="workspace-footer">
            <span>
              <Brand small /> A little more intentional.
            </span>
            <span>
              {auth.isAuthenticated
                ? 'Your data. Your perspective.'
                : 'Demo data · Stored on this device'}
            </span>
          </footer>
        </main>
      </div>
      {modal?.type === 'entry' && (
        <EntryDialog
          key={modal.entry?.id || 'new'}
          entry={modal.entry}
          month={month}
          ledger={ledger}
          onClose={closeModal}
          notify={notify}
        />
      )}
      {modal?.type === 'settings' && (
        <SettingsDialog ledger={ledger} onClose={closeModal} notify={notify} />
      )}
      {modal?.type === 'command' && (
        <CommandDialog
          ledger={ledger}
          onClose={closeModal}
          navigate={navigate}
          onEdit={onEdit}
          onAdd={onAdd}
        />
      )}
      {modal?.type === 'about' && (
        <AboutDialog
          isDemo={!auth.isAuthenticated}
          reset={ledger.reset}
          onClose={closeModal}
          notify={notify}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="check" size={17} />
          </span>
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
