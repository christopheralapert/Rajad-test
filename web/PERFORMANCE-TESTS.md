# Ressursijõudluse testid (Lighthouse)

See dokument on hindamise jaoks: kuidas mõõtsid jõudlust ja millised tulemused said.

## Tööriist

- **Google Chrome DevTools → Lighthouse**
  - mõõdikud: Performance, Accessibility, Best Practices, SEO

## Kuidas testida

1. Tee production build (web kaustas):
   - `npm install`
   - `npm run build`
2. Lae `dist/` sisu üles (näiteks cPanel `public_html/` alla) või serveeri lokaalselt.
3. Ava leht **Google Chrome**'is.
4. Ava DevTools → Lighthouse.
5. Vali:
   - Device: **Mobile** ja tee jooks
   - Device: **Desktop** ja tee jooks
6. Salvesta report (PDF või HTML) ja lisa siia kokkuvõte.

## Tulemused (täida pärast testimist)

| Leht | Device | Performance | Accessibility | Best Practices | SEO |
|---|---|---:|---:|---:|---:|
| Home (`/`) | Mobile |  |  |  |  |
| Home (`/`) | Desktop |  |  |  |  |
| Map (`/map`) | Mobile |  |  |  |  |
| Map (`/map`) | Desktop |  |  |  |  |

## Lühianalüüs

- Mis mõjutas tulemust kõige rohkem? (nt suured pildid, JS bundle suurus, third‑party skriptid)
- Mida optimeerisid? (nt pildi suuruse vähendamine, lazy loading, code-splitting)
- Mis jäi tegemata, aga annaks parandust? (nt chunking, prefetch, server-side compression)

## Soovitused

- Kui Performance score on madal:
  - kontrolli piltide formaate (WebP/AVIF), suuruseid
  - lazy-load pildid/video
  - jaga JS chunkideks (dynamic import)
- Kui Accessibility score on madal:
  - paranda kontraste, lisa aria-labelid, fokuseeritavus

