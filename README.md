# CampusTrace

> CampusTrace is a lost-and-found platform built for United International University (UIU) CSE students. Students report lost or found items, browse active listings, get smart matching between opposite reports, verify ownership through claims, and receive in-app + email notifications. Admins moderate everything through a dedicated panel.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [API Endpoints (Overview)](#api-endpoints-overview)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- User authentication (signup / login / password reset)
- Create and browse incident reports with images
- Matching and claiming reports between users
- Notifications and email integration
- Image upload integration (ImageKit)

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB 
- Email: Gmail OAuth, Nodemailer
- Image hosting: ImageKit 

## Repository Structure

Top-level folders:

- `client/` — React frontend
  - `src/` — React source files (components, pages, assets)
  - `index.html`, `vite.config.js`, `package.json`
- `server/` — Express backend
  - `src/` — application code (controllers, models, routes, services)
  - `server.js` — entry point
  - `package.json`

See the code for more detail under `client/src` and `server/src`.

## Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- MongoDB instance (local or hosted e.g., MongoDB Atlas)

## Getting Started (Local Development)

1. Clone the repository

```bash
git clone <repo-url>
cd CampusTrace
```

2. Install dependencies for both client and server

```bash
cd client
npm install

cd ../server
npm install
```

3. Configure environment variables (see below)

4. Start development servers in two terminals

Frontend:

```bash
cd client
npm run dev
```

Backend:
```bash
cd server
node server.js / nodemon server.js
```

Open the frontend URL reported by Vite (usually http://localhost:5173) and ensure the backend is running on the configured port (default commonly `http://localhost:3000`).

## Environment Variables

Create a `.env` file in the `server/` folder with the environment variables required by your configuration. Typical variables used by this project include:

- `PORT` — Server port (e.g., `3000`)
- `MONGO_URI` or `DATABASE_URL` — MongoDB connection string
- `JWT_SECRET` — Secret for signing JSON Web Tokens
- `EMAIL_CLIENT_ID` — Gmail OAuth client ID (if using Gmail OAuth)
- `EMAIL_CLIENT_SECRET` — Gmail OAuth client secret
- `EMAIL_REFRESH_TOKEN` — Gmail OAuth refresh token
- `EMAIL_USER` — Email address used to send messages
- `IMAGEKIT_PUBLIC_KEY` — ImageKit public key
- `IMAGEKIT_PRIVATE_KEY` — ImageKit private key
- `IMAGEKIT_ENDPOINT` — ImageKit upload endpoint (if required)

Note: Check `server/src/config` for exact variable names used in your copy of the codebase.

## Scripts

Client (in `client/package.json`): common scripts

- `npm run dev` — Start Vite dev server
- `npm run build` — Build production bundle
- `npm run preview` — Preview production build

Server (in `server/package.json`): common scripts

- `npm run dev` — Start server with `nodemon` (development)
- `npm start` — Start server (production)

Adjust the exact commands by checking each `package.json`.

## API Endpoints (Overview)

The backend exposes REST endpoints grouped under routes. Examples (check `server/src/routes` for exact paths):

- `POST /auth/signup` — Create a new user
- `POST /auth/login` — Authenticate a user
- `GET /reports` — List reports
- `POST /reports` — Create a report (authenticated)
- `GET /reports/:id` — Get report details
- `POST /matches` — Create/accept matches
- `GET /notifications` — List user notifications

Authentication is typically handled via JWT sent in an `Authorization: Bearer <token>` header.

## Testing

There are no centralized tests included by default. To test locally:

- Start both servers (frontend and backend) and exercise flows in the UI
- Used API tools like Postman 

If you want unit or integration tests, consider adding a test framework (Jest / Supertest) under `server/` and `client/`.

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repo
2. Create a feature branch
3. Make changes and add tests where appropriate
4. Open a pull request with a clear description

Please follow existing code style and linting rules.

## Helpful Notes

- A helper script for Gmail OAuth exists under `server/scripts/gmail-oauth-helper.mjs` to obtain tokens for sending email.
- Image uploads are integrated with ImageKit in `server/src/services/imagekit.service.js` (check service implementation for details).

## License


---
