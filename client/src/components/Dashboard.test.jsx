import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Dashboard from './Dashboard';

const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();
const deleteMock = vi.fn();
const toast = {
  success: vi.fn(),
  error: vi.fn(),
};

const authState = {
  currentUser: { id: 1, name: 'Ben' },
};

vi.mock('../api/axios.js', () => ({
  default: {
    get: (...args) => getMock(...args),
    post: (...args) => postMock(...args),
    put: (...args) => putMock(...args),
    delete: (...args) => deleteMock(...args),
  },
}));

vi.mock('../context/useAuth.jsx', () => ({
  useAuth: () => authState,
}));

vi.mock('../context/useToast.jsx', () => ({
  useToast: () => toast,
}));

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

describe('Dashboard', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    authState.currentUser = { id: 1, name: 'Ben' };
  });

  it('shows loading state while fetching projects', () => {
    getMock.mockReturnValue(new Promise(() => {}));

    renderDashboard();

    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
  });

  it('shows error state when fetching projects fails', async () => {
    getMock.mockRejectedValueOnce({ response: { data: { message: 'Network down' } } });

    renderDashboard();

    expect(await screen.findByText('Network down')).toBeInTheDocument();
  });

  it('shows fallback fetch error when API message is missing', async () => {
    getMock.mockRejectedValueOnce({});

    renderDashboard();

    expect(await screen.findByText('Unable to load projects right now')).toBeInTheDocument();
  });

  it('shows empty state when there are no projects', async () => {
    getMock.mockResolvedValueOnce({ data: [] });

    renderDashboard();

    expect(await screen.findByText('No projects yet. Create your first project.')).toBeInTheDocument();
  });

  it('renders existing projects from API', async () => {
    getMock.mockResolvedValueOnce({
      data: [
        {
          id: 9,
          title: 'Alpha',
          description: 'First project',
          status: 'active',
        },
      ],
    });

    renderDashboard();

    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('First project')).toBeInTheDocument();
  });

  it('validates required title before creating a project', async () => {
    getMock.mockResolvedValueOnce({ data: [] });

    renderDashboard();

    await screen.findByText('No projects yet. Create your first project.');
    fireEvent.click(screen.getByRole('button', { name: 'New Project' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Project title is required')).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('creates a project and shows success toast', async () => {
    getMock.mockResolvedValueOnce({ data: [] });
    postMock.mockResolvedValueOnce({
      data: {
        id: 10,
        title: 'Created Project',
        description: 'Created desc',
        status: 'active',
      },
    });

    renderDashboard();

    await screen.findByText('No projects yet. Create your first project.');
    fireEvent.click(screen.getByRole('button', { name: 'New Project' }));

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Created Project' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Created desc' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/projects', {
        user_id: 1,
        title: 'Created Project',
        description: 'Created desc',
        status: 'active',
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Project created');
    expect(await screen.findByText('Created Project')).toBeInTheDocument();
  });

  it('shows auth validation error when creating without current user id', async () => {
    authState.currentUser = null;
    getMock.mockResolvedValueOnce({ data: [] });

    renderDashboard();

    await screen.findByText('No projects yet. Create your first project.');
    fireEvent.click(screen.getByRole('button', { name: 'New Project' }));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Should Fail' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('You must be logged in to create a project')).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('shows fallback toast when create request fails without API message', async () => {
    getMock.mockResolvedValueOnce({ data: [] });
    postMock.mockRejectedValueOnce({});

    renderDashboard();

    await screen.findByText('No projects yet. Create your first project.');
    fireEvent.click(screen.getByRole('button', { name: 'New Project' }));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Create Failure' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unable to create project right now');
    });
  });

  it('edits a project and updates the list', async () => {
    getMock.mockResolvedValueOnce({
      data: [
        {
          id: 11,
          title: 'Legacy Project',
          description: 'Old desc',
          status: 'active',
        },
      ],
    });
    putMock.mockResolvedValueOnce({
      data: {
        id: 11,
        title: 'Updated Project',
        description: 'Refined desc',
        status: 'on-hold',
      },
    });

    renderDashboard();

    await screen.findByText('Legacy Project');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Legacy Project' }));

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Updated Project' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Refined desc' },
    });
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'on-hold' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/projects/11', {
        title: 'Updated Project',
        description: 'Refined desc',
        status: 'on-hold',
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Project saved');
    expect(await screen.findByText('Updated Project')).toBeInTheDocument();
  });

  it('shows fallback toast when update request fails without API message', async () => {
    getMock.mockResolvedValueOnce({
      data: [{ id: 15, title: 'Needs Update', description: 'desc', status: 'active' }],
    });
    putMock.mockRejectedValueOnce({});

    renderDashboard();

    await screen.findByText('Needs Update');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Needs Update' }));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Still Fails' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unable to update project right now');
    });
  });

  it('deletes a project after confirmation', async () => {
    getMock.mockResolvedValueOnce({
      data: [
        {
          id: 12,
          title: 'Delete Me',
          description: 'Soon gone',
          status: 'active',
        },
      ],
    });
    deleteMock.mockResolvedValueOnce({ data: { message: 'Project deleted successfully' } });

    renderDashboard();

    await screen.findByText('Delete Me');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Delete Me' }));

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith('/projects/12');
    });

    expect(toast.success).toHaveBeenCalledWith('Project deleted');
    await waitFor(() => {
      expect(screen.queryByText('Delete Me')).not.toBeInTheDocument();
    });
  });

  it('shows fallback toast when delete request fails without API message', async () => {
    getMock.mockResolvedValueOnce({
      data: [{ id: 16, title: 'Cannot Delete', description: 'desc', status: 'active' }],
    });
    deleteMock.mockRejectedValueOnce({});

    renderDashboard();

    await screen.findByText('Cannot Delete');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Cannot Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unable to delete project right now');
    });
  });

  it('shows API error message in toast when create request fails with message', async () => {
    getMock.mockResolvedValueOnce({ data: [] });
    postMock.mockRejectedValueOnce({ response: { data: { message: 'Server rejected project' } } });

    renderDashboard();

    await screen.findByText('No projects yet. Create your first project.');
    fireEvent.click(screen.getByRole('button', { name: 'New Project' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Bad Project' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server rejected project');
    });
  });

  it('shows API error message in toast when update request fails with message', async () => {
    getMock.mockResolvedValueOnce({
      data: [{ id: 20, title: 'Old Title', description: 'desc', status: 'active' }],
    });
    putMock.mockRejectedValueOnce({ response: { data: { message: 'Update rejected' } } });

    renderDashboard();

    await screen.findByText('Old Title');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Old Title' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Update rejected');
    });
  });

  it('shows API error message in toast when delete request fails with message', async () => {
    getMock.mockResolvedValueOnce({
      data: [{ id: 21, title: 'Doomed', description: 'desc', status: 'active' }],
    });
    deleteMock.mockRejectedValueOnce({ response: { data: { message: 'Delete rejected' } } });

    renderDashboard();

    await screen.findByText('Doomed');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Doomed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Delete rejected');
    });
  });

  it('closes the create modal when cancel button is clicked', async () => {
    getMock.mockResolvedValueOnce({ data: [] });

    renderDashboard();

    await screen.findByText('No projects yet. Create your first project.');
    fireEvent.click(screen.getByRole('button', { name: 'New Project' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the create modal when the overlay backdrop is clicked', async () => {
    getMock.mockResolvedValueOnce({ data: [] });

    renderDashboard();

    await screen.findByText('No projects yet. Create your first project.');
    fireEvent.click(screen.getByRole('button', { name: 'New Project' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('presentation'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('pre-populates the edit modal form with the existing project data', async () => {
    getMock.mockResolvedValueOnce({
      data: [{ id: 22, title: 'My Project', description: 'My desc', status: 'on-hold' }],
    });

    renderDashboard();

    await screen.findByText('My Project');
    fireEvent.click(screen.getByRole('button', { name: 'Edit My Project' }));

    expect(screen.getByLabelText('Title')).toHaveValue('My Project');
    expect(screen.getByLabelText('Description')).toHaveValue('My desc');
    expect(screen.getByLabelText('Status')).toHaveValue('on-hold');
  });

  it('shows "No description yet." for projects without a description', async () => {
    getMock.mockResolvedValueOnce({
      data: [{ id: 23, title: 'Bare Project', description: null, status: 'active' }],
    });

    renderDashboard();

    expect(await screen.findByText('No description yet.')).toBeInTheDocument();
  });

  it('renders the "Open Board" link pointing to the project board', async () => {
    getMock.mockResolvedValueOnce({
      data: [{ id: 24, title: 'Linked Project', description: 'desc', status: 'active' }],
    });

    renderDashboard();

    const link = await screen.findByRole('link', { name: 'Open Board' });
    expect(link).toHaveAttribute('href', '/projects/24');
  });

  it('shows validation error when update submitted with empty title', async () => {
    getMock.mockResolvedValueOnce({
      data: [{ id: 25, title: 'Has Title', description: 'desc', status: 'active' }],
    });

    renderDashboard();

    await screen.findByText('Has Title');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Has Title' }));

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('Project title is required')).toBeInTheDocument();
    expect(putMock).not.toHaveBeenCalled();
  });

  it('closes the delete confirmation when cancel is clicked', async () => {
    getMock.mockResolvedValueOnce({
      data: [{ id: 26, title: 'Stay Alive', description: 'desc', status: 'active' }],
    });

    renderDashboard();

    await screen.findByText('Stay Alive');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Stay Alive' }));
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
