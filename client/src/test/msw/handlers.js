import { http, HttpResponse } from 'msw';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

export const handlers = [
  http.post(`${API_BASE}/auth/login`, async () =>
    HttpResponse.json({
      token: 'test-token',
      user: { id: 1, name: 'Test User', email: 'test@example.com' },
    })
  ),

  http.post(`${API_BASE}/auth/register`, async () =>
    HttpResponse.json(
      {
        token: 'test-token',
        user: { id: 2, name: 'New User', email: 'new@example.com' },
      },
      { status: 201 }
    )
  ),

  http.get(`${API_BASE}/projects`, async () => HttpResponse.json([])),

  http.get(`${API_BASE}/projects/:id`, async ({ params }) =>
    HttpResponse.json({
      id: Number(params.id),
      title: 'Sample Project',
      description: 'Project description',
      status: 'active',
    })
  ),

  http.get(`${API_BASE}/projects/:id/tasks`, async () => HttpResponse.json([])),

  http.post(`${API_BASE}/projects`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 101, ...body, created_at: new Date().toISOString() }, { status: 201 });
  }),

  http.post(`${API_BASE}/projects/:id/tasks`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        id: 201,
        project_id: Number(params.id),
        ...body,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.put(`${API_BASE}/tasks/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ id: Number(params.id), ...body });
  }),

  http.delete(`${API_BASE}/tasks/:id`, async () =>
    HttpResponse.json({ message: 'Task deleted successfully' })
  ),
];
