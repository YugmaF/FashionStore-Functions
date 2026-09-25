# FashionStore API

Node/Express API for the FashionStore client.

## Local development

Use Node 14 for the legacy dependency set.

```bash
npm install
docker compose up -d mongo
npm run seed:local
npm run start:local
```

The API is available at `http://localhost:8000/api`. The seed command is idempotent and loads a small catalog containing active, upcoming, and expired promotional offers.

Set `LOCAL_MONGO_URI` to seed a different local database. Set `MONGO_URI` when starting the API against another MongoDB instance.
