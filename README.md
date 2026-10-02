# Backend Auth

A Node.js/Express authentication API using PostgreSQL, bcrypt, and JWT access and refresh tokens.

## Requirements

- Node.js and npm
- PostgreSQL

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a PostgreSQL database and the tables expected by the API:

   ```sql
   CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       name TEXT NOT NULL,
       email TEXT NOT NULL UNIQUE,
       password TEXT NOT NULL,
       role TEXT NOT NULL DEFAULT 'user',
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE refresh_token (
       id SERIAL PRIMARY KEY,
       user_id INTEGER NOT NULL REFERENCES users(id),
       token_hash TEXT NOT NULL,
       expires_at TIMESTAMPTZ NOT NULL,
       revoked_at TIMESTAMPTZ
   );
   ```

3. Create a `.env` file in the project root with your local database settings and strong, independent JWT secrets:

   ```dotenv
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   JWT_ACCESS_SECRET=replace_with_a_long_random_secret
   JWT_REFRESH_SECRET=replace_with_a_different_long_random_secret
   ```

   Keep `.env` private; it is excluded from Git.

4. Start the API:

   ```bash
   npm start
   ```

   The server listens on port `3000`.

## API

All routes are prefixed with `/auth`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register with `name`, `email`, and `password` |
| `POST` | `/auth/login` | Log in with `email` and `password`; returns an access token and sets an HTTP-only refresh-token cookie |
| `POST` | `/auth/refresh` | Exchange the refresh-token cookie for a new access token and refresh-token cookie |
| `POST` | `/auth/logout` | Revoke the refresh token and clear its cookie |
| `GET` | `/auth/profile` | Get the authenticated user's token claims; requires `Authorization: Bearer <access-token>` |
| `GET` | `/auth/admin` | List users; requires a valid access token with the `admin` role |

Login requests are rate-limited to five attempts per minute. Refresh tokens are stored as hashes in the database.
