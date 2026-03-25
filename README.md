# 🗂️ PERN Project Management App

A full-stack project management application built with PostgreSQL, Express, React, and Node.js.

## 🚀 Live Demo
- **Frontend:** _coming soon_
- **Backend API:** _coming soon_

## 🛠️ Tech Stack
- **Database:** PostgreSQL
- **Backend:** Node.js, Express, JWT, bcrypt
- **Frontend:** React (Vite), React Router v6, Axios, Tailwind CSS
- **Deploy:** Render (API) + Vercel (Client)

---

## 📅 Sprint Schedule (Mar 15–21, 2026)

| Day | Date | Focus |
|-----|------|-------|
| 1 | Mar 15 | Setup & Database |
| 2 | Mar 16 | Express Backend CRUD |
| 3 | Mar 17 | Authentication |
| 4 | Mar 18 | React Scaffold & Auth UI |
| 5 | Mar 19 | Core UI Features |
| 6 | Mar 20 | Polish & Error Handling |
| 7 | Mar 21 | Deploy |

---

## 🗃️ Database Schema

```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  priority VARCHAR(50) DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📡 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & receive JWT |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/projects` | Get all projects |
| GET | `/api/projects/:id` | Get single project |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Tasks
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/projects/:id/tasks` | Get tasks for project |
| POST | `/api/projects/:id/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### Backend
```bash
cd server
npm install
cp .env.example .env   # fill in your values
npm run dev
```

### Frontend
```bash
cd client
npm install
cp .env.example .env   # set VITE_API_URL
npm run dev
```

### Environment Variables

**server/.env**
```
DATABASE_URL=postgresql://localhost:5432/pern_pm
PORT=5000
JWT_SECRET=your_secret_here
```

**client/.env**
```
VITE_API_URL=http://localhost:5000
```

---

## 📁 Project Structure

```
pern-pm/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── main.jsx
│   └── package.json
├── server/                  # Express backend
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── db/
│   │   └── index.js
│   ├── app.js
│   └── package.json
└── README.md
```


---

## 🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License
[MIT](LICENSE)