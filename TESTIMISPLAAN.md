# Testimisplaan – Rajad

**GitHubi repo:** lisa siia enda GitHubi link pärast projekti üleslaadimist  
**Testitud osa:** frontend (`web` kaust)  
**Käivitamise käsk:** `npm test`

## Projekti kirjeldus

Minu projekt on **Rajad**, React + TypeScript veebirakendus Eesti matkaradade vaatamiseks. Rakenduses saab radasid sirvida, otsida, filtreerida pikkuse järgi, sortida ja kaardil vaadata. Kuna rakenduse andmed tulevad API-st, on oluline kontrollida ka seda, et API kirje muudetakse kasutajaliidese jaoks õigeks objektiks.

## Testimise eesmärk

Testimise eesmärk oli kontrollida just seda osa rakendusest, mille viga oleks kasutajale kohe nähtav: vale keel, valed koordinaadid, puuduvad andmed, otsing, filter ja sortimine. Selleks tõstsin filtreerimise ja sortimise loogika eraldi faili `src/pages/filterUtils.ts`, et seda oleks lihtsam ühiktestidega kontrollida.

## Testimisraamistik

Kasutasin **Node.js sisseehitatud test runnerit** (`node:test`) koos TypeScripti kompileerimisega. Testid asuvad kaustas `web/src/__tests__`.

Testide käivitamine:

```bash
cd web
npm test
```

## Testitavad funktsionaalsused

| Nr | Funktsionaalsus | Miks testida | Oodatav tulemus |
|---:|---|---|---|
| 1 | `toTrackView` eesti keeles | Rakendus peab näitama eestikeelse kasutajaliidese korral õigeid välju | Kasutatakse `name_et`, `county_et`, `description_et` ja `highlights_et` väärtusi |
| 2 | `toTrackView` inglise keeles | Keelevahetus ei tohi andmete kuvamist rikkuda | Kasutatakse `name_en`, `county_en`, `description_en` ja `highlights_en` väärtusi |
| 3 | Koordinaadid | Kaart vajab alguspunkti õiges formaadis | `start_lat` ja `start_lng` muutuvad väärtuseks `[lat, lng]` |
| 4 | Puuduvad koordinaadid | Kõigil radadel ei pruugi alguspunkti olla | Kui üks koordinaat puudub, on `coordinates` väärtus `null` |
| 5 | Puuduvad tekstiväljad | API andmed võivad olla poolikud | Puuduvad tekstid muutuvad tühjaks stringiks ja `reviewCount` väärtuseks saab `0` |
| 6 | Detailvaate geomeetria | Raja detailvaates peab säilima ka rajajoon | `geometry_geojson` lisatakse vaateobjekti `geometry` väljale |
| 7 | Otsing raja nime järgi | Kasutaja peab raja leidma ka siis, kui sisestab väikeste tähtedega | Otsing `raba` leiab „Viru raba õpperaja“ |
| 8 | Otsing kirjelduse järgi | Otsing ei tohiks töötada ainult nime põhjal | Otsing leiab raja ka kirjelduse või maakonna järgi |
| 9 | Pikkusefilter | Kasutaja saab valida sobiva pikkusega rajad | Tagastatakse ainult valitud vahemikku jäävad rajad |
| 10 | Sortimine pikkuse järgi | Tulemuste järjekord peab olema ootuspärane | Rajad järjestatakse pikkuse järgi kasvavalt või kahanevalt |
| 11 | Algse massiivi säilimine | Sortimine ei tohiks olemasolevaid andmeid kogemata muuta | `sortTracks` tagastab uue massiivi ega muuda algset |
| 12 | Kombineeritud filter + sort | Päris kasutuses toimivad mitu valikut korraga | Tulemus on korraga filtreeritud ja õigesti sorditud |

## Testimise tulemus

Testid käivitusid edukalt. Kokku läbiti **13 testi** ja ebaõnnestunud teste ei olnud.

```text
# tests 13
# suites 5
# pass 13
# fail 0
```

Terminali kuvatõmmis on lisatud testimisplaani dokumenti ja esitlusse.

## Lühike kokkuvõte

Kõige kasulikum oli see, et eraldasin testitava loogika Reacti komponendist eraldi funktsioonidesse. Nii on testid lühemad, arusaadavamad ja neid saab käivitada ilma brauserit või andmebaasi käivitamata.
