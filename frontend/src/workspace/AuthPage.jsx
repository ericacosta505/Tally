import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon, { Brand } from './Icon';
import './workspace.css';
import './auth.css';
export default function AuthPage({ signup = false }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    document.title = `${signup ? 'Create your workspace' : 'Welcome back'} · Tally`;
    try {
      const message = sessionStorage.getItem('expiredTokenMessage');
      if (message) {
        setError(message);
        sessionStorage.removeItem('expiredTokenMessage');
      }
    } catch (_) {}
  }, [signup]);
  useEffect(() => {
    if (auth.isAuthenticated) navigate('/', { replace: true });
  }, [auth.isAuthenticated, navigate]);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const result = signup ? await auth.signup(form) : await auth.login(form.email, form.password);
    if (result.success) navigate('/');
    else setError(result.error);
    setBusy(false);
  };
  return (
    <div className="tally-auth">
      <section className="auth-story">
        <Link to="/" className="auth-brand">
          <Brand />
        </Link>
        <div className="auth-story-content">
          <span className="eyebrow">MAKE ROOM FOR WHAT’S NEXT</span>
          <h1>
            A little more
            <br />
            intentional.
          </h1>
          <p>
            Less wondering where it went.
            <br />
            More deciding where you’ll go.
          </p>
          <div className="auth-ledger">
            <div>
              <Icon name="spark" size={20} />
              <span>THE EVERYDAY, IN PERSPECTIVE</span>
            </div>
            <strong>
              Your next chapter
              <br />
              starts with clarity.
            </strong>
            <div className="auth-rule">
              <span>01</span>Know where you stand.
              <Icon name="check" size={17} />
            </div>
            <div className="auth-rule">
              <span>02</span>Make a plan that fits.
              <Icon name="check" size={17} />
            </div>
            <div className="auth-rule">
              <span>03</span>Keep a little for tomorrow.
              <Icon name="check" size={17} />
            </div>
          </div>
        </div>
        <span className="auth-story-footer">PERSONAL FINANCE, WITH PERSPECTIVE.</span>
      </section>
      <section className="auth-main">
        <Link to="/" className="back-to-demo">
          <Icon name="arrow" size={16} />
          Back to the demo
        </Link>
        <div className="auth-form-wrap">
          <span className="eyebrow">YOUR MONEY. YOUR SPACE.</span>
          <h2>{signup ? 'A fresh perspective.' : 'Good to see you again.'}</h2>
          <p>
            {signup
              ? 'Create an account and start with a clean slate.'
              : 'Sign in to your personal workspace.'}
          </p>
          <form onSubmit={submit}>
            {signup && (
              <div className="form-columns">
                <label className="form-field">
                  First name
                  <input
                    name="first_name"
                    autoComplete="given-name"
                    required
                    maxLength="100"
                    value={form.first_name}
                    onChange={change}
                    placeholder="Jamie"
                  />
                </label>
                <label className="form-field">
                  Last name
                  <input
                    name="last_name"
                    autoComplete="family-name"
                    required
                    maxLength="100"
                    value={form.last_name}
                    onChange={change}
                    placeholder="Davis"
                  />
                </label>
              </div>
            )}
            <label className="form-field">
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength="120"
                value={form.email}
                onChange={change}
                placeholder="you@example.com"
              />
            </label>
            <label className="form-field">
              Password
              <input
                name="password"
                type="password"
                autoComplete={signup ? 'new-password' : 'current-password'}
                required
                minLength={signup ? 10 : undefined}
                maxLength="128"
                value={form.password}
                onChange={change}
                placeholder={signup ? 'At least 10 characters' : 'Your password'}
              />
            </label>
            {signup && (
              <div className="form-columns">
                <label className="form-field">
                  Phone number
                  <input
                    name="phone_number"
                    type="tel"
                    autoComplete="tel"
                    required
                    maxLength="20"
                    value={form.phone_number}
                    onChange={change}
                    placeholder="(312) 555-0123"
                  />
                </label>
                <label className="form-field">
                  Date of birth
                  <input
                    name="date_of_birth"
                    type="date"
                    autoComplete="bday"
                    required
                    min="1900-01-01"
                    max={new Date(Date.now() - 86400000).toISOString().slice(0, 10)}
                    value={form.date_of_birth}
                    onChange={change}
                  />
                </label>
              </div>
            )}
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button className="button primary auth-submit" disabled={busy}>
              {busy ? 'One moment…' : signup ? 'Create your workspace' : 'Sign in'}
              <Icon name="arrow" size={17} />
            </button>
          </form>
          <div className="auth-toggle">
            {signup ? 'Already have a workspace?' : 'A new beginning?'}{' '}
            <Link to={signup ? '/login' : '/signup'}>
              {signup ? 'Sign in' : 'Create an account'}
            </Link>
          </div>
          <div className="auth-demo-callout">
            <Icon name="wallet" size={19} />
            <div>
              <strong>Just looking around?</strong>
              <p>Explore the full experience with sample data.</p>
            </div>
            <Link to="/" aria-label="Explore the demo">
              <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
        <span className="auth-footnote">
          Your account starts empty. Demo activity stays separate.
        </span>
      </section>
    </div>
  );
}
