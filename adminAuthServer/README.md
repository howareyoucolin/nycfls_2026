# Admin Auth Server

Better Auth backend for the native `adminApp`.

## Install

```bash
cd adminAuthServer
npm install
```

## Configure

```bash
cp .env.example .env
```

Set `BETTER_AUTH_SECRET` to a long random secret.

## Run migrations

```bash
npm run migrate
```

## Start the server

```bash
npm run dev
```

The server runs on `http://localhost:8787` by default.

## Notes

- Only `howareyoucolin@gmail.com` can sign up.
- Android emulator should use `http://10.0.2.2:8787` from the app.
- iOS simulator can keep using `http://localhost:8787`.
