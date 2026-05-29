# MartNow / ShopFront E-commerce Website

This is a small Node + Express demo store with an admin dashboard for adding products and images.

Key updates for mobile usage and hosting

- The server requires Node.js (it is not a static-only site). It handles image uploads and stores products in `data/products.json`.
- The server now accepts common phone image types and limits uploads to 10 MB.
- The admin image inputs include the `capture="environment"` attribute so mobile browsers can open the camera directly when adding images.
- The server binds to all interfaces (`0.0.0.0`) and prints LAN IPs at startup so you can access it from your phone over the same Wi‑Fi network.

Quick start (local, accessible from phone on same network)

1. Open a terminal in the project root.

```bash
npm install
node server.js
```

2. After startup the server prints addresses such as:

```
E-commerce app running on port 3002
 - Local: http://localhost:3002
 - On your network: http://192.168.1.42:3002
```

3. Open the `http://<your-lan-ip>:3002` URL from your phone browser (same Wi‑Fi). Use the Admin Panel to add products and upload images from your phone.

Hosting notes

- GitHub Pages cannot run the Node server — it only serves static files. To host the full app (server + uploads) use services like Render, Railway, Fly.io, or a VPS.
- For quick public testing you can expose your local server with `ngrok`:

```bash
npx ngrok http 3002
```

Security reminder

- This demo uses a simple static admin password (`admin123`). For production, implement secure authentication, HTTPS, rate limiting, and robust file validation.

If you want, I can add a `start` script, a simple deploy config for Render, or help secure the admin endpoints.
