/**
 * Verified trail layers.
 *
 * Rationale: the project imports only from explicit, documented layers in Maa- ja Ruumiamet Geoportaal,
 * so that the data source is traceable and "kontrollitud".
 *
 * If you need more layers, add them here (preferred) so they stay audited/traceable.
 */

export const VERIFIED_TRAIL_LAYERS = [
  {
    typeName: 'poi_matkarada_j',
    titleEt: 'Matkarada',
    titleEn: 'Hiking trail',
    provider: 'Maa- ja Ruumiamet (POI andmestik, mitme allika koond)',
    // Layer exists in the same POI WFS endpoint.
    geoportaalMetaUrl: 'https://teenus.maaamet.ee/ows/huviobjektid-poi?layer=poi_matkarada_j&request=GetMetadata',
  },
  {
    typeName: 'poi_rmk_matkarada_j',
    titleEt: 'RMK matkarada',
    titleEn: 'RMK hiking trail',
    provider: 'Riigimetsa Majandamise Keskus (RMK)',
    geoportaalMetaUrl:
      'https://geoportaal.maaamet.ee/index.php?fatlayerid=poi_rmk_matkarada_j&lang_id=1&page_id=912&plugin_act=getfatlayerid',
  },
  {
    typeName: 'poi_rmk_matkatee_j',
    titleEt: 'RMK matkatee',
    titleEn: 'RMK hiking route',
    provider: 'Riigimetsa Majandamise Keskus (RMK)',
    geoportaalMetaUrl:
      'https://geoportaal.maaamet.ee/index.php?fatlayerid=poi_rmk_matkatee_j&lang_id=1&page_id=912&plugin_act=getfatlayerid',
  },
  {
    typeName: 'poi_kea_matkarada_j',
    titleEt: 'KeA/KOV matkarada',
    titleEn: 'Environmental Board / municipalities hiking trail',
    provider: 'Keskkonnaamet (KeA) ja omavalitsused (KOV)',
    geoportaalMetaUrl:
      'https://geoportaal.maaamet.ee/index.php?fatlayerid=poi_kea_matkarada_j&lang_id=1&page_id=912&plugin_act=getfatlayerid',
  },
  {
    typeName: 'poi_eestiterviserada_j',
    titleEt: 'Terviserada',
    titleEn: 'Health trail',
    provider: 'SA Eesti Terviserajad',
    geoportaalMetaUrl:
      'https://geoportaal.maaamet.ee/index.php?fatlayerid=poi_eestiterviserada_j&lang_id=1&page_id=912&plugin_act=getfatlayerid',
  },
];
