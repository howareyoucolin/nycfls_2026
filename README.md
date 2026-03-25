# dadi360_2026

PHP + MySQL site with local Docker support and DreamHost deployment via GitHub Actions.

## Local development

### Prerequisites

- Docker and Docker Compose

### Run locally

```bash
docker-compose up --build
```

- **App:** http://localhost:18084
- **phpMyAdmin:** http://localhost:18085

### Shell into the PHP container

```bash
docker exec -it dadi360-2026 /bin/bash
```

## GitHub Actions secrets

Set this repository secret before deploying from `main`:

- `DH_PROD_CONFIG_JSON`

Use [`secrets/dreamhost-config.json`](/Users/colinzhou/Desktop/test/dadi360_2026/secrets/dreamhost-config.json) as your local template for the JSON payload. The `secrets/` folder is gitignored, so you can keep your real values there safely and copy the whole JSON object into the `DH_PROD_CONFIG_JSON` GitHub secret.
