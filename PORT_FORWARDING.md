# Port forwarding / Dev Tunnel setup

The frontend and backend URLs are now controlled by environment variables. You should not need to edit JavaScript source files when a tunnel URL changes.

## Local development

### Backend `.env`
```env
PORT=5000
HOST=0.0.0.0
BACKEND_PUBLIC_URL=http://localhost:5000
FRONTEND_URLS=http://localhost:5173,http://127.0.0.1:5173
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Decentralized KG
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api/graph
```

Start the backend:
```powershell
cd backend
npm install
npm run dev
```

Start the frontend in another terminal:
```powershell
cd frontend
npm install
npm run dev
```

## When the backend is port-forwarded

Suppose your backend tunnel is:
`https://YOUR-BACKEND-TUNNEL`

Change only the frontend `.env`:
```env
VITE_API_URL=https://YOUR-BACKEND-TUNNEL/api/graph
```

The backend must listen on `0.0.0.0`, which is already configured through `HOST=0.0.0.0`.

## When the frontend is also port-forwarded

Suppose the frontend is opened at:
`https://YOUR-FRONTEND-TUNNEL`

Change backend `.env`:
```env
FRONTEND_URLS=https://YOUR-FRONTEND-TUNNEL
WEBAUTHN_RP_ID=YOUR-FRONTEND-TUNNEL-HOSTNAME
```

For a Dev Tunnel, use the hostname only for `WEBAUTHN_RP_ID`, without `https://` and without a path.

Example:
```env
FRONTEND_URLS=https://abc-5173.inc1.devtunnels.ms
WEBAUTHN_RP_ID=abc-5173.inc1.devtunnels.ms
```

If both local and tunnel frontend URLs should work at the same time:
```env
FRONTEND_URLS=http://localhost:5173,http://127.0.0.1:5173,https://abc-5173.inc1.devtunnels.ms
```

After changing a Vite `.env`, restart the Vite dev server so the new value is loaded.

## Important security note

Never put the backend wallet private key, Neo4j password, RPC secrets, JWT secret, or Google OAuth client secret in frontend variables beginning with `VITE_`. Vite exposes `VITE_*` values to browser code.
