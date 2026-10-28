import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api';
import './style.css';

function App() {
  const [view, setView] = useState('register');
  const [form, setForm] = useState({ username: '', email: '', password: '', address: '' });
  const [interests, setInterests] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState('');
  const [suggestionError, setSuggestionError] = useState('');
  const [notice, setNotice] = useState('');
  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  function switchView(next) { setView(next); setError(''); setNotice(''); setForm({ ...form, password: '' }); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (view === 'register') {
        await api.register(form); setView('login'); setForm({ ...form, password: '' }); setNotice('Your account is ready. Sign in to continue.');
      } else {
        const { token, userId } = await api.login({ email: form.email, password: form.password });
        sessionStorage.setItem('accessToken', token);
        try { const data = await api.profile(userId, token); setUser(data.user); setForm({ ...form, password: '' }); }
        catch (e) { sessionStorage.removeItem('accessToken'); throw e; }
      }
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function suggest() {
    setSuggesting(true); setSuggestionError(''); setSuggestions([]);
    try { const data = await api.suggest(interests.split(',').map(s => s.trim()).filter(Boolean)); setSuggestions(data.suggestions); }
    catch (e) { setSuggestionError(e.message); }
    finally { setSuggesting(false); }
  }
  return <div className="shell">
    <aside className="story"><a className="brand" href="/" aria-label="NagaEd home"><span className="brand-mark">n.</span>NagaEd</a>
      <div className="story-content"><div className="book-art" aria-hidden="true"><i/><i/><i/><span>Learn.<br/>Explore.<br/>Become.</span></div><h1>A little curiosity.<br/>A world of possibility.</h1><p>Your next chapter starts with a space to call your own.</p></div>
      <footer>Learning, connected.</footer>
    </aside>
    <main><div className="main-top">Your learning space <span className="dot"/></div>
    {user ? <section className="panel dashboard"><span className="welcome-icon" aria-hidden="true">&#10022;</span><h2>Welcome, {user.username}.</h2><p className="intro">You're all set. This is your personal learning space.</p><dl><dt>Email</dt><dd>{user.email}</dd><dt>Address</dt><dd>{user.address}</dd></dl><button onClick={() => { sessionStorage.removeItem('accessToken'); setUser(null); switchView('login'); }}>Sign out</button></section> :
    <section className="panel"><nav className="tabs" aria-label="Account"><button aria-current={view === 'register' ? 'page' : undefined} onClick={() => switchView('register')} disabled={busy}>Create account</button><button aria-current={view === 'login' ? 'page' : undefined} onClick={() => switchView('login')} disabled={busy}>Sign in</button></nav>
      <h2>{view === 'register' ? 'Make yourself at home.' : 'Good to see you again.'}</h2><p className="intro">{view === 'register' ? 'Create an account and begin your next chapter.' : 'Sign in to your personal learning space.'}</p>
      {error && <p className="message error" role="alert">{error}</p>}{notice && <p className="message success" role="status">{notice}</p>}
      <form onSubmit={submit}><fieldset disabled={busy}>
        {view === 'register' && <label>Username<input name="username" value={form.username} onChange={change} required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" autoComplete="username" placeholder="Choose your username"/><small>3-30 letters, numbers or underscores.</small></label>}
        <label>Email address<input type="email" name="email" value={form.email} onChange={change} required maxLength={254} autoComplete="email" placeholder="you@example.com"/></label>
        <label>Password<input type="password" name="password" value={form.password} onChange={change} required minLength={8} autoComplete={view === 'register' ? 'new-password' : 'current-password'} placeholder="At least 8 characters"/></label>
        {view === 'register' && <label>Address<textarea name="address" value={form.address} onChange={change} required maxLength={500} rows={2} autoComplete="street-address" placeholder="Your address"/></label>}
        <button className="primary" type="submit">{busy ? 'Please wait...' : view === 'register' ? 'Create account' : 'Sign in'}</button>
      </fieldset></form>
      {view === 'register' && <details className="suggest"><summary>Need a username? Find a little inspiration.</summary><label>Your interests<small>Separate up to 10 interests with commas.</small><input value={interests} onChange={e => setInterests(e.target.value)} maxLength={500} placeholder="Music, science, mountain trails"/></label><button className="secondary" onClick={suggest} disabled={suggesting || busy || !interests.trim()}>{suggesting ? 'Finding ideas...' : 'Suggest usernames'}</button>{suggestionError && <p role="alert" className="message error">{suggestionError}</p>}<div className="suggestions" aria-live="polite">{suggestions.map(name => <button disabled={busy} key={name} onClick={() => setForm({ ...form, username: name })}>{name}</button>)}</div></details>}
    </section>}<footer className="main-footer">A space for every curious mind.</footer></main>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
