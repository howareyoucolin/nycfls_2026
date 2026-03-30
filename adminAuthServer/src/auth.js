import 'dotenv/config';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { betterAuth } from 'better-auth';
import { expo } from '@better-auth/expo';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDirectory, 'better-auth.sqlite');
const allowedEmails = ['howareyoucolin@gmail.com'];

fs.mkdirSync(dataDirectory, { recursive: true });

export const auth = betterAuth({
  database: new Database(dbPath),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    'replace-this-dev-secret-before-production-1234567890',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:8787',
  trustedOrigins: [
    'adminapp://',
    'adminapp://*',
    'exp://',
    'exp://**',
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-up/email') {
        return;
      }

      const email = String(ctx.body?.email || '')
        .trim()
        .toLowerCase();

      if (!allowedEmails.includes(email)) {
        throw new APIError('BAD_REQUEST', {
          message: 'This email is not allowed to register for the admin app.',
        });
      }
    }),
  },
  plugins: [expo()],
  telemetry: {
    enabled: false,
  },
});
