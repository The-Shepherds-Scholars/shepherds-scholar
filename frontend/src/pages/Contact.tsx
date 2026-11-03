import { useState, type FormEvent } from 'react';

// Wireframe 12. Posts to Formspree; set VITE_FORMSPREE_ID in frontend/.env.
const FORM_ID = import.meta.env.VITE_FORMSPREE_ID;

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!FORM_ID) {
      setStatus('failed');
      return;
    }
    setStatus('sending');
    const res = await fetch(`https://formspree.io/f/${FORM_ID}`, {
      method: 'POST',
      body: new FormData(e.currentTarget),
      headers: { Accept: 'application/json' },
    }).catch(() => null);
    setStatus(res?.ok ? 'sent' : 'failed');
  }

  const field = { minHeight: 48, padding: '0 14px', font: 'inherit', border: '1px solid #8c8580', borderRadius: 8 } as const;
  return (
    <main style={{ maxWidth: 720 }}>
      <h1>Contact me</h1>
      <p className="muted">Questions, corrections, and source suggestions are all welcome.</p>
      <form onSubmit={onSubmit} className="card" style={{ display: 'grid', gap: 18, borderTop: '3px solid var(--accent)' }}>
        <label style={{ display: 'grid', gap: 6, fontWeight: 500 }}>Name<input name="name" required autoComplete="name" style={field} /></label>
        <label style={{ display: 'grid', gap: 6, fontWeight: 500 }}>Email<input name="email" type="email" required autoComplete="email" style={field} /></label>
        <label style={{ display: 'grid', gap: 6, fontWeight: 500 }}>
          What is it about?
          <select name="topic" style={field}>
            <option>A question</option>
            <option>A correction</option>
            <option>A source to suggest</option>
            <option>Just saying hello</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6, fontWeight: 500 }}>
          Message<textarea name="message" rows={6} required style={{ ...field, padding: '12px 14px' }} />
        </label>
        <input type="hidden" name="_subject" value="New message from The Shepherd’s Scholar" />
        <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }} />
        <button className="button" type="submit" disabled={status === 'sending'} style={{ justifySelf: 'start' }}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        <p role="status" style={{ margin: 0 }}>
          {status === 'sent' && 'Thank you. Your message is on its way.'}
          {status === 'failed' && (FORM_ID ? 'Something went wrong. Please try again.' : 'The form isn’t connected yet: add VITE_FORMSPREE_ID to frontend/.env.')}
        </p>
      </form>
    </main>
  );
}
