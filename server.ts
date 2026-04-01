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

  app.use(express.json());

  const cmsPath = path.join(__dirname, "src", "cms.json");

  // API Routes
  app.get("/api/cms", (req, res) => {
    const data = JSON.parse(fs.readFileSync(cmsPath, "utf-8"));
    res.json(data);
  });

  app.post("/api/cms", (req, res) => {
    fs.writeFileSync(cmsPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
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
