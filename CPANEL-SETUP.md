# Estonia Trails / Eesti matkarajad — cPanel deploy juhend

See juhend eeldab, et sul on cPanelis olemas **Setup Node.js App** (Node.js Selector) ja sul on domeen suunatud hostingu poole.

## Eelistatud arhitektuur
- **Frontend (Vite/React)**: staatiline build -> `public_html/`
- **Backend (Node/Express)**: eraldi **subdomain** (nt `api.sinu-domeen.ee`) -> cPanel *Setup Node.js App*
- **Andmebaas**: PostgreSQL + PostGIS (kas hostingu sees või välisena: Supabase / Neon)

---

## 0) Failid
- `web/` — frontend
- `server/` — backend
- `server/app.js` — **cPanel/Passenger** startup file (jäta see alles!)
- `server/sql/schema.sql` — DB skeem

---

## 1) Frontend (public_html/Rajad)

### 1.1 Seadista API URL (enne buildi)
Fail: `web/.env.production`

Näide (kopeeri `web/.env.production.example`):

```
VITE_API_BASE=https://api.sinu-domeen.ee
```

### 1.2 Tee production build
Lokaalselt (Kali/PC):

```
cd web
npm install
npm run build
```

Tulemus tekib: `web/dist/`

### 1.3 Upload cPanelisse
- cPanel -> **File Manager**
- loo (või kasuta olemasolevat) kaust: `public_html/Rajad/`
- lae üles `web/dist/` **sisu** (failid ja kaustad) kausta `public_html/Rajad/`

### 1.4 Lisa .htaccess (SPA routing)
Loo `public_html/Rajad/.htaccess` sisuga:

```
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

> Märkus: kuna app jookseb alamkaustas `/Rajad/`, peab React Router kasutama `basename` väärtust `/Rajad`.
> Selles projektis on see lahendatud nii, et buildi ajal pannakse Vite `base` väärtuseks `/Rajad/`
> ja Router võtab `import.meta.env.BASE_URL` järgi õige baasi.

---

## 2) Andmebaas (PostgreSQL + PostGIS)

### Variant A: Supabase (lihtne)
1) loo Supabase projekt
2) Database -> Extensions -> enable `postgis`
3) võta ühenduse string (DATABASE_URL)
4) impordi skeem `server/sql/schema.sql`

### Variant B: Neon
1) loo Neon projekt
2) käivita SQL: `CREATE EXTENSION IF NOT EXISTS postgis;`
3) impordi skeem `server/sql/schema.sql`

Skeemi import (kui sul on psql):

```
psql "DATABASE_URL" -f server/sql/schema.sql
```

---

## 3) Backend (Setup Node.js App)

### 3.1 Loo subdomain
cPanel -> **Domains** -> **Subdomains**
- nimi: `api`
- dokument root: (lase cPanelil luua)

### 3.2 Upload backend
- cPanel -> **File Manager**
- mine subdomaini document root kausta (nt `/home/USER/api.sinu-domeen.ee/`)
- lae üles KÕIK `server/` kausta sisu

**Soovitus:** hoia backend eraldi kataloogis, mitte `public_html` all.

### 3.3 Loo .env
Koosta subdomaini serveri kaustas fail `server/.env` (või sea ENV vars cPanel UI-st):

```
# PORT jäta cPaneli/Passenegeri jaoks automaatseks või ära muuda
CORS_ORIGIN=https://sinu-domeen.ee,https://www.sinu-domeen.ee
DATABASE_URL=postgresql://USER:PASS@HOST:5432/DBNAME?sslmode=require
```

### 3.4 Loo Node rakendus cPanelis
cPanel -> **Setup Node.js App**
- Node versioon: **20** (või 18+)
- Application root: sinu backend kaust
- Application URL: `https://api.sinu-domeen.ee`
- Application startup file: `app.js`

### 3.5 Install + build
cPanel -> **Terminal** (või SSH)

```
cd /home/USER/path/to/server
npm install
npm run build
```

Seejärel Setup Node.js App lehel vajuta **Restart**.

---

## 4) Test
- Ava: `https://api.sinu-domeen.ee/api/health` -> peaks tagastama `{ ok: true }`
- Ava: `https://sinu-domeen.ee` -> front peaks laadima ja kaart peaks nägema API andmeid

---

## 5) Tüüpilised vead
- **404 refreshil**: .htaccess puudu või vales kohas
- **CORS error**: `CORS_ORIGIN` ei sisalda sinu frontendi domeeni
- **DB error**: PostGIS pole enable või DATABASE_URL vale

