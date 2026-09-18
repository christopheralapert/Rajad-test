import { Router } from 'express';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from "node:crypto";

export const uploadsRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../uploads');

function extFromContentType(ct?: string | null): string | null {
  if (!ct) return null;
  const t = ct.split(';')[0].trim().toLowerCase();
  if (t === 'image/jpeg') return 'jpg';
  if (t === 'image/png') return 'png';
  if (t === 'image/webp') return 'webp';
  return null;
}

uploadsRouter.post(
  '/',
  express.raw({
    type: ['image/jpeg', 'image/png', 'image/webp'],
    limit: '12mb',
  }),
  async (req, res) => {
    try {
      const ext = extFromContentType(req.headers['content-type']);
      if (!ext) {
        res.status(415).json({ error: 'Unsupported content-type. Use image/jpeg, image/png, or image/webp.' });
        return;
      }

      const body = req.body as Buffer;
      if (!body || !Buffer.isBuffer(body) || body.length === 0) {
        res.status(400).json({ error: 'Missing image body' });
        return;
      }

      await fs.mkdir(uploadsDir, { recursive: true });

      const id = crypto.randomUUID();
      const filename = `${id}.${ext}`;
      const filePath = path.join(uploadsDir, filename);

      await fs.writeFile(filePath, body);

      // Return relative URL so it works behind the same origin (Vite proxies /uploads in dev)
      res.json({ url: `/uploads/${filename}` });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Upload failed' });
    }
  },
);
