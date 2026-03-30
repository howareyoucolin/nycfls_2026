import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';

const app = express();
const port = Number(process.env.PORT || 8787);

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'admin-auth-server',
    url: process.env.BETTER_AUTH_URL || `http://localhost:${port}`,
  });
});

app.all('/api/auth', toNodeHandler(auth));
app.all('/api/auth/{*any}', toNodeHandler(auth));

app.listen(port, '0.0.0.0', () => {
  console.log(`Better Auth server listening on http://0.0.0.0:${port}`);
});
