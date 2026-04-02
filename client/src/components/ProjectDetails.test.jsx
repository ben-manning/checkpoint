import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import ProjectDetails from './ProjectDetails';

const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();
const deleteMock = vi.fn();
const toast = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock('../api/axios.js', () => ({
  default: {
    get: (...args) => getMock(...args),
    post: (...args) => postMock(...args),
    put: (...args) => putMock(...args),
    delete: (...args) => deleteMock(...args),
  },
}));

vi.mock('../context/useToast.jsx', () => ({
  useToast: () => toast,
}));

const renderProjectDetails = (route = '/projects/42') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path='/projects/:id' element={<ProjectDetails />} />
      </Routes>
    </MemoryRouter>
  );

describe('ProjectDetails', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it('shows loading state while project board is fetching', () => {
    getMock.mockReturnValue(new Promise(() => {}));

    renderProjectDetails();

    expect(screen.getByText('Loading project board...')).toBeInTheDocument();
  });

  it('shows error view with back link when initial load fails', async () => {
    getMock.mockRejectedValueOnce({ response: { data: { message: 'Project not found' } } });

    renderProjectDetails();

    expect(await screen.findByText('Project not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Dashboard' })).toBeInTheDocument();
  });

  it('shows fallback error when initial load fails without API message', async () => {
    getMock.mockRejectedValueOnce({});

    renderProjectDetails();

    expect(await screen.findByText('Unable to load project details')).toBeInTheDocument();
  });

  it('renders project and tasks, including unknown status fallback display', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({
          data: { id: 42, title: 'Roadmap', description: 'Q2 goals', status: 'active' },
        });
      }
      if (url === '/projects/42/tasks') {
        return Promise.resolve({
          data: [
            { id: 1, title: 'Task A', description: 'A', status: 'todo' },
            { id: 2, title: 'Task B', description: 'B', status: 'in_progress' },
            { id: 3, title: 'Task C', description: 'C', status: 'done' },
            { id: 4, title: 'Task D', description: 'D', status: 'blocked' },
          ],
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderProjectDetails();

    expect(await screen.findByText('Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Q2 goals')).toBeInTheDocument();
    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Task D')).toBeInTheDocument();
    expect(screen.getByText('Status: blocked')).toBeInTheDocument();
  });

  it('validates title before creating a task', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({ data: [] });
    });

    renderProjectDetails();

    await screen.findByText('Roadmap');
    fireEvent.click(screen.getByRole('button', { name: 'New Task' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Task' }));

    expect(await screen.findByText('Task title is required')).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('creates a task and shows success toast', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({ data: [] });
    });
    postMock.mockResolvedValueOnce({
      data: {
        id: 20,
        project_id: 42,
        title: 'Write tests',
        description: 'For project details',
        status: 'todo',
        priority: 'high',
        due_date: '2026-04-30',
      },
    });

    renderProjectDetails();

    await screen.findByText('Roadmap');
    fireEvent.click(screen.getByRole('button', { name: 'New Task' }));

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: ' Write tests ' } });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: ' For project details ' },
    });
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'high' } });
    fireEvent.change(screen.getByLabelText('Due Date'), { target: { value: '2026-04-30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Task' }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/projects/42/tasks', {
        title: 'Write tests',
        description: 'For project details',
        status: 'todo',
        priority: 'high',
        due_date: '2026-04-30',
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Task added');
    expect(await screen.findByText('Write tests')).toBeInTheDocument();
  });

  it('reverts task status and shows error toast when move fails', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({
        data: [{ id: 30, title: 'Move Me', description: '', status: 'todo' }],
      });
    });
    putMock.mockRejectedValueOnce({ response: { data: { message: 'Update failed' } } });

    renderProjectDetails();

    await screen.findByText('Move Me');
    fireEvent.click(screen.getByRole('button', { name: 'Move to In Progress' }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/tasks/30', { status: 'in_progress' });
    });

    expect(await screen.findByText('Status: To Do')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Update failed');
  });

  it('updates task status when move succeeds', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({
        data: [{ id: 31, title: 'Move Success', description: '', status: 'todo' }],
      });
    });
    putMock.mockResolvedValueOnce({
      data: { id: 31, title: 'Move Success', description: '', status: 'in_progress' },
    });

    renderProjectDetails();

    await screen.findByText('Move Success');
    fireEvent.click(screen.getByRole('button', { name: 'Move to In Progress' }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/tasks/31', { status: 'in_progress' });
    });

    expect(await screen.findByText('Status: In Progress')).toBeInTheDocument();
  });

  it('shows fallback toast when create task fails without API message', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({ data: [] });
    });
    postMock.mockRejectedValueOnce({});

    renderProjectDetails();

    await screen.findByText('Roadmap');
    fireEvent.click(screen.getByRole('button', { name: 'New Task' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fail Task' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Task' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unable to create task right now');
    });
  });

  it('deletes a task after confirmation and shows success toast', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({
        data: [{ id: 44, title: 'Delete Task', description: '', status: 'todo' }],
      });
    });
    deleteMock.mockResolvedValueOnce({ data: { message: 'Task deleted successfully' } });

    renderProjectDetails();

    await screen.findByText('Delete Task');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Delete Task' }));
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith('/tasks/44');
    });

    expect(toast.success).toHaveBeenCalledWith('Task deleted');
    await waitFor(() => {
      expect(screen.queryByText('Delete Task')).not.toBeInTheDocument();
    });
  });

  it('shows fallback toast when delete task fails without API message', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({
        data: [{ id: 45, title: 'Fail Delete', description: '', status: 'todo' }],
      });
    });
    deleteMock.mockRejectedValueOnce({});

    renderProjectDetails();

    await screen.findByText('Fail Delete');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Fail Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unable to delete task right now');
    });
  });

  it('shows "No description" for tasks with null or empty description', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({
        data: [{ id: 50, title: 'Silent Task', description: null, status: 'todo' }],
      });
    });

    renderProjectDetails();

    await screen.findByText('Silent Task');
    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('shows project description fallback when project has no description', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Bare Project', description: null, status: 'active' } });
      }
      return Promise.resolve({ data: [] });
    });

    renderProjectDetails();

    expect(await screen.findByText('No project description yet.')).toBeInTheDocument();
  });

  it('closes task creation modal when cancel button is clicked', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({ data: [] });
    });

    renderProjectDetails();

    await screen.findByText('Roadmap');
    fireEvent.click(screen.getByRole('button', { name: 'New Task' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not show a "Move to In Progress" button for a task already in In Progress', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({
        data: [{ id: 60, title: 'Already Moving', description: '', status: 'in_progress' }],
      });
    });

    renderProjectDetails();

    await screen.findByText('Already Moving');
    expect(screen.queryByRole('button', { name: 'Move to In Progress' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move to To Do' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move to Done' })).toBeInTheDocument();
  });

  it('shows fallback error toast when move task fails without API message', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({
        data: [{ id: 61, title: 'Stuck Task', description: '', status: 'todo' }],
      });
    });
    putMock.mockRejectedValueOnce({});

    renderProjectDetails();

    await screen.findByText('Stuck Task');
    fireEvent.click(screen.getByRole('button', { name: 'Move to In Progress' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unable to move task');
    });
  });

  it('shows API error message toast when delete task fails with message', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({
        data: [{ id: 62, title: 'Reject Delete', description: '', status: 'todo' }],
      });
    });
    deleteMock.mockRejectedValueOnce({ response: { data: { message: 'Task already deleted' } } });

    renderProjectDetails();

    await screen.findByText('Reject Delete');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Reject Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Task already deleted');
    });
  });

  it('closes delete confirm dialog when cancel button is clicked', async () => {
    getMock.mockImplementation((url) => {
      if (url === '/projects/42') {
        return Promise.resolve({ data: { id: 42, title: 'Roadmap', status: 'active' } });
      }
      return Promise.resolve({
        data: [{ id: 63, title: 'Keep Me', description: '', status: 'todo' }],
      });
    });

    renderProjectDetails();

    await screen.findByText('Keep Me');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Keep Me' }));
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
