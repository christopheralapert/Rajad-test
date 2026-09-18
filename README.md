# Rajad webapp (ET/EN) + andmebaas + kaart

See projekt sisaldab:
- **web/** – React + Vite kasutajaliides (ET/EN keelevahetus)
- **server/** – Node/Express API + **PostgreSQL + PostGIS** andmebaas
- **Maa-ameti (Maa- ja Ruumiamet) aluskaart** (TMS) läbi proxy
- import-skript, mis toob **Eesti matkarajad** Maa-ameti **Huvipunktide (POI) WFS** teenusest andmebaasi

## Miks PostgreSQL + PostGIS?
- **PostGIS** on de-facto standard geomeetria (rajajoone) salvestamiseks ja päringuteks (kaugus, lõigud, bounding box, jne).
- Saab teha **kiireid ruumipäringuid** (GiST indeks) kui rajad kasvavad tuhande(te)ni.
- Avatud lähtekood + lai hostimisvalik (Docker, Supabase, Neon, RDS).

## Logo vahetamine
Kaardil olev logo tuleb failist **web/public/brand-logo.svg**.
Asenda see oma logoga (säilita sama failinimi) ja UI kasutab automaatselt teie logo.

## Andmeallikas: kõik Eesti matkarajad
Andmete import käib Maa- ja Ruumiameti WFS teenustest (OGC standard) ja salvestatakse PostGIS-i.

**Oluline:** vaikimisi impordib projekt ainult *kontrollitud (vetted)* kihte (allowlist), mis on dokumenteeritud Maa- ja Ruumiameti Geoportaalis.
Allowlist asub failis **server/src/verified-trail-layers.mjs**.

Vaikimisi imporditakse:
- `poi_rmk_matkarada_j` (RMK matkarajad)
- `poi_rmk_matkatee_j` (RMK matkatee)
- `poi_kea_matkarada_j` (Keskkonnaameti/KOV matkarajad)
- `poi_eestiterviserada_j` (Eesti Terviserajad)

Kui soovid importida *lisakihte*, lisa need esmalt **server/src/verified-trail-layers.mjs** faili (soovitatav).
Ajutiseks override'iks võid panna `.env` faili `MAAAMET_POI_TYPENAMES=...`, kuid mitte-allowlist kihid blokeeritakse, kuni seadistad `ALLOW_UNVERIFIED_LAYERS=true`.

### Andmete viitamine
Kui avaldad kaardipilte või andmeid, lisa allikaviide (nt "Aluskaart / rajad: Maa- ja Ruumiamet 2026").

## Käivitamine (arendus)

### 1) Andmebaas

```bash
cd rajad-webapp
docker compose up -d
```

### 2) Server

```bash
cd server
cp .env.example .env
npm install

# loob tabelid + PostGIS
npm run db:init

# toob matkarajad WFS-ist
npm run import:maaamet:wfs

# käivita API
npm run dev
```

### 3) Veeb

```bash
cd web
npm install
npm run dev
```

Ava: http://localhost:3000

## Märkused aluskaardi kohta
Maa-amet soovitab TMS teenuse kasutamisel:
- lisada identifitseerivad parameetrid (`ASUTUS`, `KESKKOND`, jne)
- kasutada proxy't.
Seetõttu on veebis `TileLayer` URL kujul `/api/maaamet/...` ning server teeb päringu edasi Maa-ameti tile serverisse.

