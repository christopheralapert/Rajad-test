import { Router } from 'express';

export const maaametRouter = Router();

// Proxy for Maa- ja Ruumiamet (Maa-amet) TMS tiles.
// Maa-amet's documentation recommends using a proxy and adding identifying parameters
// (ASUTUS / KESKKOND / optional IS).
maaametRouter.get('/tms/:tileSet/:z/:x/:y.:ext', async (req, res) => {
  const { tileSet, z, x, y, ext } = req.params;

  // Basic hardening (tileSet is part of the remote path)
  if (!/^[A-Za-z0-9_@-]+$/.test(tileSet)) {
    res.status(400).json({ error: 'Invalid tileSet' });
    return;
  }

  if (!/^(png|jpeg|jpg)$/.test(ext)) {
    res.status(400).json({ error: 'Invalid ext' });
    return;
  }

  // Defaults are chosen to match Maa-ameti example parameters and work out-of-the-box.
  // You should still set these in server/.env for your org.
  const asutus = process.env.MAAAMET_ASUTUS || 'MAAAMET';
  const keskkond = process.env.MAAAMET_KESKKOND || 'EXAMPLES';
  const isCode = process.env.MAAAMET_IS || '';

  // Maa-ameti own Leaflet/TMS examples append parameters using '&' directly after the extension.
  // We follow that convention for maximum compatibility with their tile server.
  // Ref: Maa-ameti TMS/WMTS/WMS-C API guide (Leaflet TMS examples).
  let remoteUrl = `https://tiles.maaamet.ee/tm/tms/1.0.0/${tileSet}/${z}/${x}/${y}.${ext}`;
  remoteUrl += `&ASUTUS=${encodeURIComponent(asutus)}&KESKKOND=${encodeURIComponent(keskkond)}`;
  if (isCode) remoteUrl += `&IS=${encodeURIComponent(isCode)}`;

  try {
    const upstream = await fetch(remoteUrl, {
      headers: { 'User-Agent': 'rajad-webapp/1.0' },
    });

    if (!upstream.ok) {
      res.status(upstream.status).send(`Upstream error: ${upstream.statusText}`);
      return;
    }

    const contentType = upstream.headers.get('content-type') || (ext === 'png' ? 'image/png' : 'image/jpeg');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (e: any) {
    res.status(502).json({ error: e?.message || 'Tile proxy failed' });
  }
});
