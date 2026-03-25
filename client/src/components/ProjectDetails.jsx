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

const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

const EMPTY_TASK_FORM = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
};

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [movingTaskId, setMovingTaskId] = useState(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState(EMPTY_TASK_FORM);
  const [taskFormError, setTaskFormError] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setTaskFormData(EMPTY_TASK_FORM);
    setTaskFormError('');
  };

  const openDeleteConfirm = (task) => {
    setConfirmDelete(task);
    setDeleteError('');
  };

  const closeDeleteConfirm = () => {
    if (isDeleting) return;
    setConfirmDelete(null);
    setDeleteError('');
  };

  const handleDeleteTask = async () => {
    try {
      setDeleteError('');
      setIsDeleting(true);
      await api.delete(`/tasks/${confirmDelete.id}`);
      setTasks((prev) => prev.filter((t) => t.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      setDeleteError(apiMessage || 'Unable to delete task right now');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTaskChange = (e) => {
    setTaskFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!taskFormData.title.trim()) {
      setTaskFormError('Task title is required');
      return;
    }

    try {
      setTaskFormError('');
      setIsSubmittingTask(true);

      const response = await api.post(`/projects/${id}/tasks`, {
        title: taskFormData.title.trim(),
        description: taskFormData.description.trim() || null,
        status: taskFormData.status,
        priority: taskFormData.priority,
        due_date: taskFormData.due_date || null,
      });

      setTasks((prev) => [response.data, ...prev]);
      closeTaskModal();
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      setTaskFormError(apiMessage || 'Unable to create task right now');
    } finally {
      setIsSubmittingTask(false);
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
        <div className='project-header-right'>
          <span className='project-status'>
            {project?.status || 'active'}
          </span>
          <button
            type='button'
            className='primary-btn'
            onClick={() => setIsTaskModalOpen(true)}
          >
            New Task
          </button>
        </div>
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
                    <div className='task-card-head'>
                      <h4>{task.title}</h4>
                      <button
                        type='button'
                        className='icon-btn icon-btn-danger'
                        aria-label={`Delete ${task.title}`}
                        onClick={() => openDeleteConfirm(task)}
                      >
                        🗑️
                      </button>
                    </div>
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

      {isTaskModalOpen && (
        <div className='modal-overlay' role='presentation' onClick={closeTaskModal}>
          <div
            className='modal-card'
            role='dialog'
            aria-modal='true'
            aria-label='Create task form'
            onClick={(e) => e.stopPropagation()}
          >
            <h3>New Task</h3>
            <form onSubmit={handleCreateTask} className='project-form'>
              {taskFormError && <p className='form-error'>{taskFormError}</p>}

              <label htmlFor='task-title'>Title</label>
              <input
                id='task-title'
                name='title'
                type='text'
                value={taskFormData.title}
                onChange={handleTaskChange}
                placeholder='Task title'
              />

              <label htmlFor='task-description'>Description</label>
              <textarea
                id='task-description'
                name='description'
                value={taskFormData.description}
                onChange={handleTaskChange}
                placeholder='Describe this task'
                rows={3}
              />

              <label htmlFor='task-status'>Status</label>
              <select
                id='task-status'
                name='status'
                value={taskFormData.status}
                onChange={handleTaskChange}
              >
                {KANBAN_COLUMNS.map((col) => (
                  <option key={col.key} value={col.key}>
                    {col.label}
                  </option>
                ))}
              </select>

              <label htmlFor='task-priority'>Priority</label>
              <select
                id='task-priority'
                name='priority'
                value={taskFormData.priority}
                onChange={handleTaskChange}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>

              <label htmlFor='task-due-date'>Due Date</label>
              <input
                id='task-due-date'
                name='due_date'
                type='date'
                value={taskFormData.due_date}
                onChange={handleTaskChange}
              />

              <div className='modal-actions'>
                <button type='button' className='ghost-btn' onClick={closeTaskModal}>
                  Cancel
                </button>
                <button type='submit' className='primary-btn' disabled={isSubmittingTask}>
                  {isSubmittingTask ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className='modal-overlay' role='presentation' onClick={closeDeleteConfirm}>
          <div
            className='modal-card'
            role='alertdialog'
            aria-modal='true'
            aria-label='Confirm delete task'
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete Task</h3>
            <p>
              Are you sure you want to delete <strong>{confirmDelete.title}</strong>? This cannot be
              undone.
            </p>
            {deleteError && <p className='form-error'>{deleteError}</p>}
            <div className='modal-actions'>
              <button type='button' className='ghost-btn' onClick={closeDeleteConfirm} disabled={isDeleting}>
                Cancel
              </button>
              <button type='button' className='danger-btn' onClick={handleDeleteTask} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectDetails;
