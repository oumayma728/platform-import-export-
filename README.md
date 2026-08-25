# Import Export API

NestJS backend for the Import/Export project.

## Run the app

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma Client:

```bash
npx prisma generate
```

3. Configure Bird:

Create a `.env` file and add your Bird API key:

```env
BIRD_API_KEY=bk_your_api_key
```

4. Start the server:

```bash
npm run start
```

The app runs at:

```text
http://localhost:3000
```

## Swagger

Open Swagger UI at:

```text
http://localhost:3000/api
```

## Useful commands

```bash
# development with watch mode
npm run start:dev

# build
npm run build

# tests
npm run test
```
