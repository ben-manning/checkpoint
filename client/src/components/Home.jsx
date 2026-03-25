
import { Link, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '../context/useAuth.jsx';
import '../styles/shared.css';

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser, navigate]);
  if (currentUser) return null;
  return (
    <main>
      {/* Hero Section */}
      <section className="container" style={{ textAlign: 'center', padding: '3rem 0 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent)' }}>
          Stop wandering. Start hitting checkpoints.
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '2.2rem', maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
          Checkpoint turns your chaotic to-do list into a clear path forward—so you always know your next move.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', marginBottom: '2.5rem' }}>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: '1.1rem' }}>
            Start Your Journey
          </Link>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="container" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.7rem' }}>
          Big goals are just a series of small wins.
        </h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.7rem' }}>
          Checkpoint helps you break things down, rack up progress, and actually finish what you start (imagine that).
        </p>
        <p style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.7rem' }}>
          No overthinking. No endless lists. Just forward motion.
        </p>
      </section>

      {/* Features Section */}
      <section id="features" className="container" style={{ marginBottom: '3.5rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>
          Level Up Your Projects
        </h2>
        <div style={{ display: 'grid', gap: '2rem', maxWidth: 900, margin: '0 auto', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div style={{ background: 'var(--accent-bg)', borderRadius: 12, padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Turn messy ideas into structured checkpoints you can actually complete. <span style={{ color: 'var(--accent)' }}>Progress = unlocked.</span></h3>
          </div>
          <div style={{ background: 'var(--accent-bg)', borderRadius: 12, padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Tasks That Don’t Feel Like Chores</h3>
            <p style={{ color: 'var(--text)' }}>Quick to add, easy to manage, and oddly satisfying to check off.</p>
          </div>
          <div style={{ background: 'var(--accent-bg)', borderRadius: 12, padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Stay in the Flow</h3>
            <p style={{ color: 'var(--text)' }}>No clutter, no distractions—just you and your next move.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container" style={{ marginBottom: '3.5rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>How It Works</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2.5rem' }}>
          <div style={{ flex: '1 1 220px', maxWidth: 320 }}>
            <h4 style={{ color: 'var(--accent)', fontWeight: 700 }}>Start a Quest</h4>
            <p>(Okay, it’s a project—but more fun.) Define your goal.</p>
          </div>
          <div style={{ flex: '1 1 220px', maxWidth: 320 }}>
            <h4 style={{ color: 'var(--accent)', fontWeight: 700 }}>Set Checkpoints</h4>
            <p>Break it down into clear milestones you can hit.</p>
          </div>
          <div style={{ flex: '1 1 220px', maxWidth: 320 }}>
            <h4 style={{ color: 'var(--accent)', fontWeight: 700 }}>Complete & Repeat</h4>
            <p>Knock out tasks, hit checkpoints, feel unstoppable.</p>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="container" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1.2rem' }}>
          Warning: may cause excessive productivity.
        </h2>
        <blockquote style={{ fontStyle: 'italic', color: 'var(--text)', maxWidth: 540, margin: '0 auto 1.2rem', fontSize: '1.1rem' }}>
          “I opened Checkpoint and suddenly finished 3 things I’d been avoiding for weeks.”<br />
          <span style={{ display: 'block', marginTop: '0.7rem', fontWeight: 500 }}>— Slightly Shocked User</span>
        </blockquote>
      </section>

      {/* Call to Action Section */}
      <section className="container" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.2rem' }}>
          Your next checkpoint is waiting.
        </h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '1.7rem' }}>
          Ready to make real progress (and actually enjoy it)?
        </p>
        <Link to="/register" className="btn btn-primary" style={{ fontSize: '1.1rem' }}>
          Start Playing… We Mean, Working
        </Link>
      </section>

      {/* Footer Tagline */}
      <footer style={{ textAlign: 'center', color: 'var(--text)', fontWeight: 500, fontSize: '1.05rem', padding: '2rem 0 1.5rem' }}>
        Checkpoint — Progress, but make it fun.
      </footer>
    </main>
  );
};

export default Home;