# dadi360_2026

PHP + MySQL site with local Docker support and DreamHost deployment via GitHub Actions.

## Local development

### Prerequisites

- Docker and Docker Compose

### Run locally

```bash
docker-compose up --build
```

- **App:** http://localhost:18082
- **phpMyAdmin:** http://localhost:18083

### Shell into the PHP container

```bash
docker exec -it dadi360-2026 /bin/bash
```

## GitHub Actions secrets

Set these repository secrets before deploying from `main`:

- `DH_PROD_SSH_KEY`
- `DH_PROD_HOST`
- `DH_PROD_USER`
- `DH_PROD_REMOTE_PATH`
- `DH_PROD_DB_HOST`
- `DH_PROD_DB_NAME`
- `DH_PROD_DB_USERNAME`
- `DH_PROD_DB_PASSWORD`
