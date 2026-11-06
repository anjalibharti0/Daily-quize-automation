import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

const TOKEN_KEY = 'yuvahive_token';
const USER_KEY = 'yuvahive_user';

function formatDate(isoDate) {
  if (!isoDate) return '';
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(readStoredUser);

  const handleLogin = (nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken('');
    setUser(null);
  }, []);

  if (!token) return <Login onLogin={handleLogin} />;

  return <Dashboard token={token} user={user} onLogout={handleLogout} />;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api.login(email, password);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand">
          <span className="brand-mark">YH</span>
          <div>
            <strong>YuvaHive</strong>
            <span>Quiz Bot Admin</span>
          </div>
        </div>

        <h1>Welcome back</h1>
        <p className="muted">
          Sign in to preview today's coding challenge and prepare it for your
          WhatsApp group.
        </p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@yuvahive.com"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your admin password"
            required
          />
        </label>

        {error && <p className="alert alert-error">{error}</p>}

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="hint">
          Credentials are configured in <code>server/.env</code> as
          {' '}
          <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code>.
        </p>
      </form>
    </div>
  );
}

function Dashboard({ token, user, onLogout }) {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [historyResult, todayResult] = await Promise.allSettled([
        api.history(token),
        api.today(token),
      ]);

      if (historyResult.status === 'fulfilled') {
        setHistory(historyResult.value.quizzes);
      } else if (historyResult.reason?.status === 401) {
        onLogout();
        return;
      } else {
        setError(historyResult.reason?.message || 'Could not load quiz history.');
      }

      if (todayResult.status === 'fulfilled') {
        setToday(todayResult.value.quiz);
      } else if (todayResult.reason?.status === 404) {
        setToday(null);
      } else if (todayResult.reason?.status === 401) {
        onLogout();
        return;
      } else {
        setError(todayResult.reason?.message || 'Could not load today\'s quiz.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  async function handleGenerate() {
    setBusy(true);
    setError('');
    try {
      const result = await api.generate(token);
      setToday(result.quiz);
      setNotice(result.created ? 'Today\'s quiz is ready.' : 'Today\'s quiz already existed.');
      await loadData();
    } catch (err) {
      if (err.status === 401) onLogout();
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStatus(status) {
    if (!today) return;
    setBusy(true);
    setError('');
    try {
      const result = await api.setStatus(token, today._id, status);
      setToday(result.quiz);
      setHistory((items) =>
        items.map((item) => (item._id === result.quiz._id ? { ...item, ...result.quiz } : item))
      );
      setNotice(status === 'posted' ? 'Marked as posted.' : 'Moved back to draft.');
    } catch (err) {
      if (err.status === 401) onLogout();
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(fields) {
    if (!today) return false;
    setBusy(true);
    setError('');
    try {
      const result = await api.update(token, today._id, fields);
      setToday(result.quiz);
      setHistory((items) =>
        items.map((item) => (item._id === result.quiz._id ? { ...item, ...result.quiz } : item))
      );
      setNotice('Quiz updated.');
      return true;
    } catch (err) {
      if (err.status === 401) onLogout();
      else setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function copyText(text, label) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setNotice(label);
    } catch {
      setError('Copy failed. Select the text manually and copy it.');
    }
  }

  const postedCount = history.filter((item) => item.status === 'posted').length;
  const draftCount = history.filter((item) => item.status === 'draft').length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">YH</span>
          <div>
            <strong>YuvaHive</strong>
            <span>Quiz Bot Admin</span>
          </div>
        </div>

        <div className="topbar-actions">
          <span className="user-email">{user?.email || 'admin'}</span>
          <button className="btn btn-ghost" type="button" onClick={loadData} disabled={loading}>
            Refresh
          </button>
          <button className="btn btn-ghost" type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="shell">
        <section className="hero">
          <div>
            <span className="eyebrow">Daily automation</span>
            <h1>Your 9:00 AM coding challenge</h1>
            <p className="muted">
              The backend prepares one quiz every day. Copy the ready-made message
              into your WhatsApp group, then mark it as posted.
            </p>
          </div>

          <div className="stats">
            <Stat label="Total quizzes" value={history.length} />
            <Stat label="Posted" value={postedCount} tone="success" />
            <Stat label="Drafts" value={draftCount} tone="warn" />
          </div>
        </section>

        {notice && <p className="alert alert-success">{notice}</p>}
        {error && <p className="alert alert-error">{error}</p>}

        <div className="layout">
          <section className="panel">
            {loading ? (
              <div className="empty">Loading today's quiz...</div>
            ) : today ? (
              <QuizPreview
                quiz={today}
                busy={busy}
                onCopy={copyText}
                onStatus={handleStatus}
                onSave={handleSave}
              />
            ) : (
              <div className="empty">
                <h2>No quiz prepared for today</h2>
                <p className="muted">
                  Generate it now, or wait for the 9:00 AM scheduler to create it.
                </p>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleGenerate}
                  disabled={busy}
                >
                  {busy ? 'Generating...' : 'Generate today\'s quiz'}
                </button>
              </div>
            )}
          </section>

          <aside className="panel">
            <div className="panel-head">
              <h2>Quiz history</h2>
              <span className="muted small">{history.length} prepared</span>
            </div>

            {history.length === 0 ? (
              <p className="muted small">No quizzes yet. Today's quiz will appear here.</p>
            ) : (
              <div className="history">
                {history.map((quiz) => (
                  <div className="history-item" key={quiz._id}>
                    <div>
                      <strong>Day {String(quiz.dayNumber).padStart(2, '0')} · {quiz.topic}</strong>
                      <span className="muted small">
                        {formatDate(quiz.date)} · {quiz.language}
                      </span>
                    </div>
                    <span className={`pill ${quiz.status === 'posted' ? 'pill-success' : 'pill-warn'}`}>
                      {quiz.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

        <p className="footnote">
          Note: the official WhatsApp Cloud API cannot post native polls into an
          arbitrary existing group. This dashboard prepares the exact text and poll
          options so an admin can publish them in seconds.
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function QuizPreview({ quiz, busy, onCopy, onStatus, onSave }) {
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setRevealed(false);
    setEditing(false);
  }, [quiz._id]);

  if (editing) {
    return (
      <QuizEditor
        quiz={quiz}
        busy={busy}
        onCancel={() => setEditing(false)}
        onSave={async (fields) => {
          const saved = await onSave(fields);
          if (saved) setEditing(false);
        }}
      />
    );
  }

  return (
    <article className="quiz">
      <div className="quiz-head">
        <div>
          <span className="eyebrow">Today's quiz</span>
          <h2>
            Day {String(quiz.dayNumber).padStart(2, '0')} · {quiz.topic}
          </h2>
        </div>
        <div className="badges">
          <span className="pill pill-accent">{quiz.language}</span>
          <span className="pill">{formatDate(quiz.date)}</span>
          <span className={`pill ${quiz.status === 'posted' ? 'pill-success' : 'pill-warn'}`}>
            {quiz.status}
          </span>
        </div>
      </div>

      <p className="question">{quiz.question}</p>

      {quiz.code && (
        <pre className="code-block">
          <code>{quiz.code}</code>
        </pre>
      )}

      <div className="options">
        {quiz.options.map((option) => {
          const isAnswer = revealed && option.key === quiz.answer;
          return (
            <div className={`option ${isAnswer ? 'option-correct' : ''}`} key={option.key}>
              <span className="option-key">{option.key}</span>
              <span>{option.text}</span>
              {isAnswer && <span className="option-tag">Correct</span>}
            </div>
          );
        })}
      </div>

      <div className="answer-box">
        <div className="answer-head">
          <strong>Answer and explanation</strong>
          <button
            className="btn btn-ghost btn-small"
            type="button"
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? 'Hide answer' : 'Reveal answer'}
          </button>
        </div>
        {revealed ? (
          <div className="answer-body">
            <p>
              <span className="pill pill-success">Answer {quiz.answer}</span>
            </p>
            <p>{quiz.explanation}</p>
          </div>
        ) : (
          <p className="muted small">Hidden so the answer stays out of the group chat.</p>
        )}
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => onCopy(quiz.whatsappQuestion, 'Question copied. Paste it in WhatsApp.')}
        >
          Copy question + options
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => onCopy(quiz.whatsappAnswer, 'Answer copied. Post it after the poll closes.')}
        >
          Copy answer + explanation
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => setEditing(true)}
          disabled={busy}
        >
          Edit quiz
        </button>
        {quiz.status === 'posted' ? (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => onStatus('draft')}
            disabled={busy}
          >
            Mark as draft
          </button>
        ) : (
          <button
            className="btn btn-success"
            type="button"
            onClick={() => onStatus('posted')}
            disabled={busy}
          >
            Mark as posted
          </button>
        )}
      </div>
    </article>
  );
}

function QuizEditor({ quiz, busy, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({
    topic: quiz.topic,
    language: quiz.language,
    question: quiz.question,
    code: quiz.code || '',
    options: quiz.options.map((option) => option.text),
    answer: quiz.answer,
    explanation: quiz.explanation,
  }));
  const [error, setError] = useState('');

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setOption(index, value) {
    setForm((current) => {
      const options = [...current.options];
      options[index] = value;
      return { ...current, options };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.topic.trim() || !form.language.trim()) {
      setError('Topic and language are required.');
      return;
    }
    if (!form.question.trim()) {
      setError('Question cannot be empty.');
      return;
    }
    if (form.options.some((option) => !option.trim())) {
      setError('All four options are required.');
      return;
    }
    if (!form.explanation.trim()) {
      setError('Explanation cannot be empty.');
      return;
    }

    setError('');
    await onSave({
      topic: form.topic.trim(),
      language: form.language.trim(),
      question: form.question.trim(),
      code: form.code,
      options: form.options.map((text, index) => ({
        key: 'ABCD'[index],
        text: text.trim(),
      })),
      answer: form.answer,
      explanation: form.explanation.trim(),
    });
  }

  return (
    <form className="quiz editor" onSubmit={handleSubmit}>
      <div className="quiz-head">
        <div>
          <span className="eyebrow">Edit quiz</span>
          <h2>
            Day {String(quiz.dayNumber).padStart(2, '0')} · Review before posting
          </h2>
        </div>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      <div className="editor-grid">
        <label className="field">
          <span>Topic</span>
          <input
            value={form.topic}
            onChange={(event) => setField('topic', event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Language</span>
          <input
            value={form.language}
            onChange={(event) => setField('language', event.target.value)}
            required
          />
        </label>
      </div>

      <label className="field">
        <span>Question</span>
        <textarea
          rows={3}
          value={form.question}
          onChange={(event) => setField('question', event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Code (optional)</span>
        <textarea
          className="mono"
          rows={6}
          value={form.code}
          onChange={(event) => setField('code', event.target.value)}
        />
      </label>

      <div className="editor-options">
        {form.options.map((option, index) => (
          <label className="field" key={index}>
            <span>Option {'ABCD'[index]}</span>
            <input
              value={option}
              onChange={(event) => setOption(index, event.target.value)}
              required
            />
          </label>
        ))}
      </div>

      <label className="field">
        <span>Correct answer</span>
        <select
          value={form.answer}
          onChange={(event) => setField('answer', event.target.value)}
        >
          {['A', 'B', 'C', 'D'].map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Explanation</span>
        <textarea
          rows={4}
          value={form.explanation}
          onChange={(event) => setField('explanation', event.target.value)}
          required
        />
      </label>

      <div className="actions">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving...' : 'Save changes'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
