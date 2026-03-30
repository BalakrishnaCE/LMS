# Project Documentation: Novel LMS

This comprehensive documentation covers the architecture, technology stack, file structure, and data flow of the **Novel LMS** project. The system is a hybrid application combining a robust **Frappe** backend, a modern **React** frontend, and a specialized **AI Microservice**.

---

## 🏗️ System Architecture Overview

The project consists of three main pillars:

1.  **Backend (Frappe App)**: Handles business logic, database management (MariaDB), authentication, and serves API endpoints.
2.  **Frontend (React SPA)**: A high-performance interface for different user roles (Admin, Student, Content Editor), communicating with the backend via REST API.
3.  **AI Microservice (HR Bot)**: A standalone Python service (FastAPI) providing RAG (Retrieval-Augmented Generation) capabilities for the AI Chat feature.

---

## 📂 1. Backend: Novel LMS (Frappe App)

**Location**: `/home/frappe/frappe-bench/apps/novel_lms`  
**Framework**: Frappe (Python)  
**Database**: MariaDB

### Key File Structure
```text
novel_lms/
├── novel_lms/
│   ├── api.py                  # Custom API endpoints entry point
│   ├── hooks.py                # App configuration, permissions, and event hooks
│   ├── novel_lms/              # Core module logic
│   │   ├── api/                # split API modules (learner, progress, analytics)
│   │   └── doctype/            # Database schema definitions (DocTypes)
│   ├── www/                    # Web page routes (serves the React app in prod)
│   └── public/                 # Static assets
└── api.py                      # (Root level) Export mechanism for APIs
```

### Core Components

#### **DocTypes (Database Schemas)**
Located in `novel_lms/novel_lms/doctype/`, these define the data models:
-   **Structure**: `Department`, `Course`, `Module`, `Lesson`, `Chapter`.
-   **Users**: `LMS User`, `LMS Student`, `LMS Admin`.
-   **Analytics**: `Learner Progress`, `Quiz Attempt`, `Quiz QA Progress`.

#### **API Layer (`api.py`)**
The `api.py` file acts as a gateway, exposing specific Python functions to the frontend.
-   **Modules**:
    -   `learner_management`: CRUD for learners.
    -   `progress_tracking`: Handling course progress and dashboards.
    -   `quiz_qa_progress`: managing quiz results.
    -   `module_management`: Fetching content structures.
    -   `analytics`: Aggregating data for dashboards.
    -   `user_permissions`: Handling complex role-based access.

#### **Hooks (`hooks.py`)**
Configures the app's integration with the Frappe framework:
-   **Website Routes**: Maps `/lms` to the frontend application.
-   **Fixtures**: Pre-defines roles (`LMS Student`, `LMS Admin`, etc.).
-   **Whitelisted Methods**: Explicitly allows the frontend to call specific Python functions.

---

## 💻 2. Frontend: Novel LMS (React App)

**Location**: `/home/frappe/frappe-bench/apps/novel_lms/LMS`  
**Framework**: React 19 + Vite  
**Language**: TypeScript  

### 🛠️ Tech Stack & Libraries
The `package.json` reveals a modern, feature-rich stack:

| Category | Libraries | Purpose |
| :--- | :--- | :--- |
| **Core** | `react`, `react-dom`, `vite` | Application framework and bundler. |
| **Routing** | `wouter` | Lightweight routing for SPAs. |
| **State** | `zustand` | Global state management. |
| **UI System** | `tailwindcss`, `radix-ui/*`, `lucide-react` | Styling, accessible primitives, and icons. |
| **Data Fetching** | `frappe-react-sdk` | Bridge to Frappe backend (auth, API calls). |
| **CMS / Editor** | `@tiptap/*` | Rich text editing for course creation. |
| **Drag & Drop** | `@dnd-kit/*` | Drag-and-drop interfaces (e.g., module organizing). |
| **Visualization** | `recharts` | Charts for analytics dashboards. |
| **Utilities** | `zod` (validation), `date-fns` (time), `jspdf` (PDF gen). |

### 📁 File Structure (`src/`)

```text
src/
├── app/
│   └── layout.tsx            # Main layout wrapper
├── components/               # Reusable UI components
│   ├── ui/                   # ShadCN UI primitive components
│   └── ...                   # Custom feature components
├── config/                   # Configuration (routes, constants)
├── contexts/                 # React Context Providers
│   ├── PermissionContext     # RBAC (Role Based Access Control) logic
│   ├── NavigationContext     # App navigation state
│   └── MediaManagerContext   # Media handling
├── hooks/                    # Custom hooks
├── lib/                      # Utilities
│   ├── frappe-provider.tsx   # Configures Frappe React SDK
│   └── protected-route.tsx   # Route guard for authentication/roles
├── pages/                    # Route Views
│   ├── AiChat/               # AI Assistant Interface
│   ├── Dashboard/            # Admin & Learner Dashboards
│   ├── ModuleEditor/         # Course content creation tools
│   ├── Modules/              # Course browsing & details
│   ├── Learners/             # Student management
│   ├── Analytics/            # Data visualization
│   └── Profile/              # User profile settings
└── App.tsx                   # Main Router & Provider setup
```

### 🛣️ Routing & Access Control
Defined in `App.tsx`, routes are protected by `ProtectedRoute` which checks user roles:
-   **Admin**: `/`, `/learners`, `/edit`, `/analytics`, `/department`
-   **Student**: `/learner-dashboard`, `/modules/learner`
-   **Shared**: `/ai`, `/profile`, `/module/:moduleName` via `ModuleDetail`

---

## 🤖 3. AI Microservice coverage (HR Bot)

**Location**: `/home/frappe/HR_BOT`  
**Port**: `8090` (Local)  
**Stack**: Python (FastAPI), LangChain, FAISS (Vector Store).

### Functionality
-   **RAG Engine**: Indexes LMS content to provide context-aware answers.
-   **API**: Exposes endpoints for the generic "Chat" interface.
-   **Integration**: The Frontend proxies requests to `/chatbot` -> `localhost:8090`.

---

## 🔄 API Processing & Data Flow

### 1. Frappe <-> React Connection
How the two separate systems talk to each other.

**A. Development Mode (`npm run dev`)**
1.  **Proxy**: `vite.config.ts` uses `proxyOptions.ts`.
2.  **Rule**: Requests to `/api/*` are forwarded to `http://127.0.0.1:8000` (Frappe).
3.  **Rule**: Requests to `/chatbot/*` are forwarded to `http://127.0.0.1:8090` (AI Service).
4.  **Auth**: Cookies are shared/forwarded by the proxy to maintain session state.

**B. Production Mode (`npm run build`)**
1.  **Build**: React app is built to static files.
2.  **Deploy**: The `build` script copies `index.html` to `../novel_lms/www/lms.html`.
3.  **Serve**: Frappe serves this HTML file when a user visits `/lms`.
4.  **Route Handling**: the `website_route_rules` in `hooks.py` ensure all clientside routes (like `/lms/modules`) are served by the same single HTML file (SPA pattern).

### 2. API Call Lifecycle
Example: **Fetching a Module List**

1.  **Frontend**: Component calls `useFrappeGetCall('novel_lms.novel_lms.api.module_management.get_admin_modules')`.
2.  **SDK**: `frappe-react-sdk` constructs a POST/GET request to `/api/method/novel_lms...`.
3.  **Network**: Request hits the Frappe Web Server.
4.  **Routing**: Frappe maps the method path to the actual Python function in `api/module_management.py`.
5.  **Execution**:
    -   Checks **Permissions** (decorators or internal logic).
    -   Queries **MariaDB** using `frappe.db.get_all` or `frappe.db.sql`.
6.  **Response**: Data is serialized to JSON and sent back.
7.  **UI**: Component receives data and renders the list.

### 3. AI Chat Flow
1.  **User**: Types a question in `/ai`.
2.  **Frontend**: Sends POST to `/chatbot/query`.
3.  **Microservice**:
    -   Receives query.
    -   Converts text to vector embeddings.
    -   Searches FAISS index for relevant course content.
    -   Constructs a prompt with context + user query.
    -   Sends to LLM (e.g., via OpenAI/Anthropic API).
4.  **Response**: Returns the answer to Frontend.

---

## 🛠️ Development Workflow

To work on this project:

1.  **Start Backend**: `bench start` (Runs Frappe on :8000).
2.  **Start AI Service**: Run `uvicorn app.main:app --port 8090` in `HR_BOT`.
3.  **Start Frontend**: `npm run dev` in `LMS/` (Runs Vite on :3000? or configured port).
4.  **Access**: Go to `localhost:3000` (or `localhost:8000/lms` for prod build test).

This documentation serves as a single source of truth for the technical stack and architecture of the Novel LMS project.
