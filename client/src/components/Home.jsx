
import { Link, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '../context/useAuth.jsx';
import '../styles/shared.css';
import './Home.css';
import checkpointLogo from '../assets/checkpoint-icons/checkpoint-logo.svg';

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser, navigate]);
  if (currentUser) return null;
  return (
    <main className='home-page'>
      <section className='container home-hero'>
        <img src={checkpointLogo} alt='Checkpoint' className='home-hero-logo' />
        <h1>
          Stop wandering. Start hitting checkpoints.
        </h1>
        <p>
          Checkpoint turns your chaotic to-do list into a clear path forward—so you always know your next move.
        </p>
        <div className='home-hero-cta'>
          <Link to='/register' className='btn btn-primary'>
            Start Your Journey
          </Link>
        </div>
      </section>
      <section className='container home-value'>
        <h2>
          Big goals are just a series of small wins.
        </h2>
        <p>
          Checkpoint helps you break things down, rack up progress, and actually finish what you start (imagine that).
        </p>
        <p>
          No overthinking. No endless lists. Just forward motion.
        </p>
      </section>
      <section id='features' className='container home-features'>
        <h2>
          Level Up Your Projects
        </h2>
        <div className='home-features-grid'>
          <div className='home-feature-card'>
            <h3>Turn messy ideas into structured checkpoints you can actually complete. <span>Progress = unlocked.</span></h3>
          </div>
          <div className='home-feature-card'>
            <h3>Tasks That Don't Feel Like Chores</h3>
            <p>Quick to add, easy to manage, and oddly satisfying to check off.</p>
          </div>
          <div className='home-feature-card'>
            <h3>Stay in the Flow</h3>
            <p>No clutter, no distractions—just you and your next move.</p>
          </div>
        </div>
      </section>
      <section className='container home-how'>
        <h2>How It Works</h2>
        <div className='home-how-steps'>
          <div className='home-how-step'>
            <h4>Start a Quest</h4>
            <p>(Okay, it’s a project—but more fun.) Define your goal.</p>
          </div>
          <div className='home-how-step'>
            <h4>Set Checkpoints</h4>
            <p>Break it down into clear milestones you can hit.</p>
          </div>
          <div className='home-how-step'>
            <h4>Complete & Repeat</h4>
            <p>Knock out tasks, hit checkpoints, feel unstoppable.</p>
          </div>
        </div>
      </section>
      <section className='container home-social-proof'>
        <h2>
          Warning: may cause excessive productivity.
        </h2>
        <blockquote>
          "I opened Checkpoint and suddenly finished 3 things I'd been avoiding for weeks."<br />
          <span>— Slightly Shocked User</span>
        </blockquote>
      </section>
      <section className='container home-cta'>
        <h2>
          Your next checkpoint is waiting.
        </h2>
        <p>
          Ready to make real progress (and actually enjoy it)?
        </p>
        <Link to='/register' className='btn btn-primary'>
          Start Playing… We Mean, Working
        </Link>
      </section>
      <footer className='home-footer'>
        Checkpoint — Progress, but make it fun.
      </footer>
    </main>
  );
};

export default Home;