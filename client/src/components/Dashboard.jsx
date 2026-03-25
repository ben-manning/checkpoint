import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = useMemo(() => ['active', 'on-hold', 'completed'], []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setError('');
        setIsLoading(true);
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (err) {
        const apiMessage = err.response?.data?.message;
        setError(apiMessage || 'Unable to load projects right now');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError('');
    setFormData({ title: '', description: '', status: 'active' });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setFormError('Project title is required');
      return;
    }

    if (!currentUser?.id) {
      setFormError('You must be logged in to create a project');
      return;
    }

    try {
      setFormError('');
      setIsSubmitting(true);

      const response = await api.post('/projects', {
        user_id: currentUser.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
      });

      setProjects((prev) => [response.data, ...prev]);
      closeModal();
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      setFormError(apiMessage || 'Unable to create project right now');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className='dashboard'>
      <header className='dashboard-header'>
        <div>
          <h2>Projects</h2>
          <p>Track your work with a fast overview of each project.</p>
        </div>
        <button type='button' className='primary-btn' onClick={() => setIsModalOpen(true)}>
          New Project
        </button>
      </header>

      {isLoading && <p className='dashboard-state'>Loading projects...</p>}
      {!isLoading && error && <p className='dashboard-state error'>{error}</p>}

      {!isLoading && !error && (
        <div className='projects-grid'>
          {projects.length === 0 ? (
            <p className='dashboard-state'>No projects yet. Create your first project.</p>
          ) : (
            projects.map((project) => (
              <article key={project.id} className='project-card'>
                <div className='project-card-head'>
                  <h3>{project.title}</h3>
                  <span className={`status-chip status-${project.status}`}>{project.status}</span>
                </div>
                <p>{project.description || 'No description yet.'}</p>
              </article>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className='modal-overlay' role='presentation' onClick={closeModal}>
          <div
            className='modal-card'
            role='dialog'
            aria-modal='true'
            aria-label='Create project form'
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Create Project</h3>
            <form onSubmit={handleCreateProject} className='project-form'>
              {formError && <p className='error'>{formError}</p>}
              <label htmlFor='title'>Title</label>
              <input
                id='title'
                name='title'
                type='text'
                value={formData.title}
                onChange={handleChange}
                placeholder='Project title'
              />

              <label htmlFor='description'>Description</label>
              <textarea
                id='description'
                name='description'
                value={formData.description}
                onChange={handleChange}
                placeholder='Describe this project'
                rows={4}
              />

              <label htmlFor='status'>Status</label>
              <select id='status' name='status' value={formData.status} onChange={handleChange}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <div className='modal-actions'>
                <button type='button' className='ghost-btn' onClick={closeModal}>
                  Cancel
                </button>
                <button type='submit' className='primary-btn' disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Dashboard;