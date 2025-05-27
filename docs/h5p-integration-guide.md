# 📚 H5P Integration with Frappe + React + Node.js

---

## 1. H5P Node.js Libraries: Research & Selection

### A. Core Libraries

#### 1. [`@lumieducation/h5p-nodejs-library`](https://context7.com/lumieducation/h5p-nodejs-library)
- **Purpose:** Core backend logic for H5P in Node.js (content validation, storage, metadata, etc.).
- **Use Case:** Use this if you want to build a custom backend or need low-level H5P operations.

#### 2. [`@lumieducation/h5p-server`](https://www.npmjs.com/package/@lumieducation/h5p-server)
- **Purpose:** Express.js server that exposes REST endpoints for H5P content CRUD, asset serving, etc.
- **Use Case:** Easiest way to add H5P backend to your stack. Handles file uploads, content listing, and serving out-of-the-box.

#### 3. [`@lumieducation/h5p-react`](https://www.npmjs.com/package/@lumieducation/h5p-react)
- **Purpose:** React component for rendering H5P content in your frontend.
- **Use Case:** Use in your React LMS to display interactive H5P content.

---

## 2. Implementation Guide

### A. Project Structure

```
/home/frappe/frappe-bench/
  apps/
    h5p_server/           # Your Node.js H5P server
      index.js            # Entry point for H5P server
    your_frappe_app/
  sites/
  ...
Procfile
nginx.conf
```

---

### B. Backend: Setting Up the H5P Node.js Server

#### 1. Install Dependencies
```bash
cd /home/frappe/frappe-bench/apps/h5p_server
npm init -y
npm install @lumieducation/h5p-server
```

#### 2. Create the Server (`index.js`)
```js
const { H5PServer } = require('@lumieducation/h5p-server');
const express = require('express');
const app = express();

const h5pServer = new H5PServer({
  // Configure storage, temp dir, etc. as needed
  // See official docs for options
});

app.use('/h5p', h5pServer.getRouter());

app.listen(3000, () => {
  console.log('H5P server running on port 3000');
});
```

#### 3. Add to Procfile
```
h5p_server: /usr/bin/node apps/h5p_server/index.js
```

#### 4. (Production) Add Supervisor Config
```ini
[program:frappe-bench-h5p-server]
command=/usr/bin/node /home/frappe/frappe-bench/apps/h5p_server/index.js
priority=4
autostart=true
autorestart=true
stdout_logfile=/home/frappe/frappe-bench/logs/h5p-server.log
stderr_logfile=/home/frappe/frappe-bench/logs/h5p-server.error.log
user=frappe
directory=/home/frappe/frappe-bench
```

#### 5. nginx Reverse Proxy
```nginx
upstream frappe-bench-h5p-server {
    server 127.0.0.1:3000 fail_timeout=0;
}

server {
    ...
    location /h5p/ {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Frappe-Site-Name your-site-name;
        proxy_set_header Origin $scheme://$http_host;
        proxy_set_header Host $host;
        proxy_pass http://frappe-bench-h5p-server;
    }
    ...
}
```
**Reference:** [revant's Gist: Node.js with Frappe Bench](https://gist.github.com/revant/18f456c1d136858bf9c132dc6fd7a167)

---

### C. Frontend: Rendering H5P in React

#### 1. Install the React Component
```bash
npm install @lumieducation/h5p-react
```

#### 2. Use in Your React Component
```jsx
import { H5P } from '@lumieducation/h5p-react';

function H5PPlayer({ contentId }) {
  return (
    <H5P
      contentId={contentId}
      endpoint="/h5p" // nginx will proxy this to Node.js server
      // ...other props (user, options, etc.)
    />
  );
}
```
- Place this in your module/lesson detail page.
- `contentId` is the H5P content identifier from your backend.

---

### D. Content Authoring & Upload

- Use the REST API from `@lumieducation/h5p-server` to upload new H5P content (from an admin panel or script).
- Or, use the [Lumi desktop app](https://lumi.education/) to create `.h5p` files and upload them to your server.

---

### E. Progress Tracking

- Listen for xAPI events from the H5P player in React.
- Send completion/progress data to your Frappe backend as needed.

---

## 3. Summary Table

| Layer     | Package                                 | Purpose                                 | Where to Use                |
|-----------|-----------------------------------------|-----------------------------------------|-----------------------------|
| Backend   | @lumieducation/h5p-server               | Serve/manage H5P content (Express API)  | Node.js/Express app         |
| Backend   | @lumieducation/h5p-nodejs-library       | Core H5P logic (used by h5p-server)     | Node.js/Express app         |
| Frontend  | @lumieducation/h5p-react                | Render H5P in React                     | React module/lesson pages   |

---

## 4. References

- [@lumieducation/h5p-nodejs-library Context7](https://context7.com/lumieducation/h5p-nodejs-library)
- [@lumieducation/h5p-server NPM](https://www.npmjs.com/package/@lumieducation/h5p-server)
- [@lumieducation/h5p-react NPM](https://www.npmjs.com/package/@lumieducation/h5p-react)
- [Lumi Education Docs](https://lumi.education/)
- [revant's Gist: Node.js with Frappe Bench](https://gist.github.com/revant/18f456c1d136858bf9c132dc6fd7a167)

---

## 5. Best Practices

- **Keep Node.js and Frappe as separate processes** for reliability and maintainability.
- **Use nginx as a reverse proxy** for a unified domain and SSL.
- **Use supervisor or pm2** to keep your Node.js server running in production.
- **Document your setup** for easy onboarding and maintenance.

---

**If you need a ready-to-use code sample, admin upload UI, or xAPI event tracking example, just ask!** 