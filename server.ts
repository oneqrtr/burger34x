import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "131094";
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  app.use(express.json());

  const supabaseHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };

  // API Routes
  app.get("/api/cms", async (req, res) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/cms_content?id=eq.1&select=data`,
        { method: "GET", headers: supabaseHeaders }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(500).json({ error: "Failed to fetch CMS data", detail: errorText });
      }

      const rows = (await response.json()) as Array<{ data: unknown }>;
      if (!rows.length) {
        return res.status(404).json({ error: "CMS content not found. Insert id=1 row first." });
      }

      res.json(rows[0].data);
    } catch (error) {
      res.status(500).json({ error: "Unexpected error while fetching CMS data" });
    }
  });

  app.post("/api/cms", async (req, res) => {
    const adminPassword = req.header("x-admin-password");
    if (adminPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/cms_content?id=eq.1`, {
        method: "PATCH",
        headers: {
          ...supabaseHeaders,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ data: req.body }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(500).json({ error: "Failed to update CMS data", detail: errorText });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Unexpected error while updating CMS data" });
    }
  });

  // Serve public/ (e.g. /video/*.mp4) before Vite so assets are not swallowed by SPA handling
  const publicPath = path.join(__dirname, "public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
