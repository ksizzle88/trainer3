# Trainer3 - AI Personal Trainer Platform

A production-ready AI personal trainer application built on a modular capability architecture. This implementation brings the specification in `/docs` to life.

## 🏗️ Architecture

Trainer3 follows a clean separation of concerns:

- **Agent Runtime** (OpenAI GPT-4) - Processes user messages and generates responses
- **API Executor** - Authoritative boundary for all side effects
- **Capability Registry** - Modular system for adding features (weights, workouts, etc.)
- **A2UI Renderer** - Deterministic UI rendering from agent-generated schemas
- **Audit Console** - Human-in-the-loop approvals for write operations

## 📦 Tech Stack

### Backend
- **Node.js + TypeScript** - Runtime and language
- **Express** - API framework
- **OpenAI API** - GPT-4 agent runtime
- **Prisma + PostgreSQL** - Database ORM and storage
- **Passport** - Authentication (email/password + Google OAuth)

### Frontend
- **React + TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling
- **A2UI Renderer** - Custom component system for agent-generated UIs

### Infrastructure
- **Docker + Docker Compose** - Containerization
- **GitHub Codespaces** - Cloud development environment

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- OpenAI API key

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd trainer3

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-proj-your-key-here

# Optional: For Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Start with Docker Compose

```bash
# Start all services (database, backend, frontend)
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

### 4. Initialize Database

```bash
# Run migrations
npm run db:migrate
```

### 5. Access the App

1. Open http://localhost:5173
2. Register a new account
3. Start chatting with your AI trainer!

## 🧑‍💻 Development

### Running Without Docker

```bash
# Install dependencies
npm install

# Start PostgreSQL (via Docker or local)
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=trainer3 \
  -e POSTGRES_PASSWORD=trainer3 \
  -e POSTGRES_DB=trainer3 \
  postgres:16-alpine

# Run database migrations
npm run db:migrate

# Start backend and frontend in dev mode
npm run dev
```

### Project Structure

```
trainer3/
├── packages/
│   ├── shared/           # Shared TypeScript types
│   │   └── src/
│   │       ├── a2ui-types.ts
│   │       ├── tool-types.ts
│   │       ├── capability-types.ts
│   │       └── auth-types.ts
│   │
│   ├── backend/          # API server + Agent runtime
│   │   ├── src/
│   │   │   ├── agent/           # OpenAI integration
│   │   │   ├── api/             # REST endpoints
│   │   │   ├── capabilities/    # Capability registry
│   │   │   ├── tools/           # Tool executors
│   │   │   ├── auth/            # Passport config
│   │   │   ├── db/              # Prisma client
│   │   │   └── middleware/
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   └── frontend/         # React web app
│       ├── src/
│       │   ├── components/
│       │   │   └── a2ui/        # A2UI renderers
│       │   ├── pages/
│       │   ├── stores/
│       │   └── lib/
│       └── index.html
│
├── docs/                 # Full specification
├── docker-compose.yml
└── .devcontainer/        # Codespaces config
```

## 🎯 Features

### ✅ Implemented

- **User Authentication**
  - Email/password registration and login
  - Google OAuth integration
  - JWT-based sessions

- **AI Chat Interface**
  - Natural language interaction with GPT-4
  - Contextual conversation history
  - Tool calling for data operations

- **Weight Tracking Capability**
  - Log weight entries via chat
  - View weight history
  - Batch editing with A2UI table editor
  - Approval workflow for writes

- **A2UI System**
  - Forms (text, number, datetime, select fields)
  - Table editors with inline editing
  - Buttons and actions
  - Deterministic rendering

- **Audit & Approvals**
  - Human-in-the-loop for write operations
  - Approval/denial workflow
  - Audit console UI

### 🚧 Future Capabilities

Per the specification in `/docs`, you can add:
- Workout planning and logging
- Fatigue modeling
- Nutrition tracking
- Check-ins and progress photos
- Custom capabilities via Studio (future)

## 📖 Core Concepts

### Capabilities

A capability bundles:
- **Data model** (Prisma schema)
- **Tools** (read/write operations)
- **UI contracts** (A2UI schemas)
- **Skill docs** (agent instructions)

Example: The `weights` capability in `packages/backend/src/capabilities/weights-capability.ts`

### A2UI (Agent-to-UI)

Strict JSON schema for UI components that the agent emits and frontend renders:

```typescript
{
  "kind": "a2ui.v1",
  "view_id": "view_123",
  "title": "Log Weight",
  "tree": {
    "type": "form",
    "id": "weight_form",
    "fields": [
      { "type": "field.datetime", "name": "measured_at", "label": "When" },
      { "type": "field.number", "name": "weight_lbs", "label": "Weight (lbs)" }
    ]
  }
}
```

### Tools

Backend-executed operations the agent can call:

- `weight_entry_list` - Read weight history
- `weight_entry_save_batch` - Create/update weights
- `weight_entry_delete_batch` - Delete weights

Tools are defined in capability definitions and routed to tool executors.

## 🔒 Security

- All write operations require approval (configurable via `ENABLE_AUDIT_MODE`)
- Agent cannot directly access database
- JWT-based authentication
- SQL injection protection via Prisma ORM
- CORS and Helmet security headers

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Development mode (all services)
npm run dev

# Build for production
npm run build

# Database operations
npm run db:migrate      # Run migrations
npm run db:studio       # Open Prisma Studio
npm run db:push         # Push schema changes

# Clean all dependencies and build artifacts
npm run clean
```

## 🐳 Codespaces

This project is fully configured for GitHub Codespaces:

1. Click "Code" → "Create codespace on main"
2. Wait for container to build
3. Environment will auto-configure with PostgreSQL
4. Add your OpenAI API key to `.env`
5. Start coding!

## 📝 API Documentation

### Authentication

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Returns: { user, token, expires_at }
```

### Agent Chat

```bash
# Send message
POST /api/agent/chat
Authorization: Bearer <token>
{
  "message": "I weigh 187.6 lbs today",
  "conversation_history": []
}

# Returns: { message, view? }
```

### Approvals

```bash
# List pending approvals
GET /api/approvals/pending
Authorization: Bearer <token>

# Approve action
POST /api/approvals/:id/approve
Authorization: Bearer <token>

# Deny action
POST /api/approvals/:id/deny
Authorization: Bearer <token>
```

## 🤝 Contributing

This implementation follows the specification in `/docs`. When adding new features:

1. Define the capability in `packages/backend/src/capabilities/`
2. Add tool executors in `packages/backend/src/tools/`
3. Update Prisma schema if needed
4. Add A2UI component renderers in frontend if needed

## 📄 License

MIT

## 🙏 Acknowledgments

Built following the Trainer3 specification architecture:
- Capability Registry pattern
- A2UI contract system
- On-demand skill loading
- Human-in-the-loop approvals

---

**Ready to build your AI personal trainer!** 🏋️‍♂️
