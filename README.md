# Saena2

Standalone e-commerce application for Saena.id. This repository is independent from any existing Saena production project.

## Stack
- React + TypeScript + Vite
- Express API on Vercel
- PostgreSQL
- DOKU payment provider
- Mengantar shipping provider

## Local development
```bash
npm ci
npm run dev
```

## Verification
```bash
npm run lint
npm run build
npm test
```

## Environment
Copy `.env.example` to `.env` and provide the required PostgreSQL, authentication, DOKU, and Mengantar values. Never commit secrets.

For initial development, the application can use its mock payment/shipping providers where supported.

## Vercel
1. Import this repository as a new Vercel project.
2. Add production environment variables in Vercel.
3. Deploy with the default Vite build configuration.
4. Verify `/api/health` before enabling live payment/shipping credentials.

Do not connect this repository to an existing Saena production project or domain unless explicitly intended.
