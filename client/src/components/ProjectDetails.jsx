import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import api from '../api/axios.js';
import './ProjectDetails.css';

const KANBAN_COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [movingTaskId, setMovingTaskId] = useState(null);

  useEffect(() => {
    const fetchProjectAndTasks = async () => {
      try {
        setError('');
        setIsLoading(true);

        const [projectResponse, tasksResponse] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/projects/${id}/tasks`),
        ]);

        setProject(projectResponse.data);
        setTasks(tasksResponse.data);
      } catch (err) {
        const apiMessage = err.response?.data?.message;
        setError(apiMessage || 'Unable to load project details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectAndTasks();
  }, [id]);

  const tasksByColumn = useMemo(() => {
    const grouped = {
      todo: [],
      in_progress: [],
      done: [],
    };

    tasks.forEach((task) => {
      const status = grouped[task.status] ? task.status : 'todo';
      grouped[status].push(task);
    });

    return grouped;
  }, [tasks]);

  const moveTaskTo = async (task, nextStatus) => {
    if (task.status === nextStatus) {
      return;
    }

    const previousStatus = task.status;

    setMovingTaskId(task.id);
    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      const response = await api.put(`/tasks/${task.id}`, { status: nextStatus });
      const updatedTask = response.data;

      setTasks((prev) =>
        prev.map((item) => (item.id === updatedTask.id ? updatedTask : item))
      );
    } catch (err) {
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, status: previousStatus } : item
        )
      );
      const apiMessage = err.response?.data?.message;
      setError(apiMessage || 'Unable to move task');
    } finally {
      setMovingTaskId(null);
    }
  };

  const renderMoveButtons = (task) => {
    const moveTargets = KANBAN_COLUMNS.filter((column) => column.key !== task.status);

    return (
      <div className='task-actions'>
        {moveTargets.map((target) => (
          <button
            key={target.key}
            type='button'
            onClick={() => moveTaskTo(task, target.key)}
            disabled={movingTaskId === task.id}
          >
            Move to {target.label}
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <p className='project-state'>Loading project board...</p>;
  }

  if (error && !project) {
    return (
      <section className='project-page'>
        <p className='project-state error'>{error}</p>
        <Link to='/dashboard' className='back-link'>
          Back to Dashboard
        </Link>
      </section>
    );
  }

  return (
    <section className='project-page'>
      <header className='project-header'>
        <div>
          <Link to='/dashboard' className='back-link'>
            Back to Dashboard
          </Link>
          <h2>{project?.title}</h2>
          <p>{project?.description || 'No project description yet.'}</p>
        </div>
        <span className='project-status'>
          {project?.status || 'active'}
        </span>
      </header>

      {error && <p className='project-state error'>{error}</p>}

      <div className='kanban-grid'>
        {KANBAN_COLUMNS.map((column) => (
          <section key={column.key} className='kanban-column'>
            <header>
              <h3>{column.label}</h3>
              <span>{tasksByColumn[column.key].length}</span>
            </header>

            <div className='kanban-list'>
              {tasksByColumn[column.key].length === 0 ? (
                <p className='empty-column'>No tasks</p>
              ) : (
                tasksByColumn[column.key].map((task) => (
                  <article key={task.id} className='task-card'>
                    <h4>{task.title}</h4>
                    <p>{task.description || 'No description'}</p>
                    <small>
                      Status: {STATUS_LABELS[task.status] || task.status}
                    </small>
                    {renderMoveButtons(task)}
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
};

export default ProjectDetails;
