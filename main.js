// =============================================================
//  main.js — entry point, bootstraps the map
// =============================================================

import { loadGeoJSON, loadArcGIS, loadGoogleSheets } from './loaders.js';
import { addLayerToMap, setLayerVisibility } from './layers.js';
import { initPopup } from './popup.js';
import { initUI, setLayerStatus } from './ui.js';

const config = window.MAP_CONFIG;

// Registry: layerId → { config, mapLayerIds, geojson }
const layerRegistry = {};

// ── Initialise map ────────────────────────────────────────────────────────────

const map = new maplibregl.Map({
  container: 'map',
  style: config.basemapStyle || 'https://tiles.openfreemap.org/styles/liberty',
  center: config.center || [0, 0],
  zoom: config.zoom ?? 10,
  minZoom: config.minZoom ?? 1,
  maxZoom: config.maxZoom ?? 22,
  attributionControl: false,
});

map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

// ── Wait for map style to load, then add layers ───────────────────────────────

map.on('load', async () => {
  // Init UI (sidebar, style panel, etc.)
  initUI(map, config, layerRegistry);

  // Init popup handler
  initPopup(map, layerRegistry);

  // Load all layers concurrently
  await Promise.allSettled(
    config.layers.map(layer => loadLayer(layer))
  );
});

// ── Load a single layer ───────────────────────────────────────────────────────

async function loadLayer(layer) {
  setLayerStatus(layer.id, 'loading');

  // Pre-register so popup handler can reference it immediately
  layerRegistry[layer.id] = { config: layer, mapLayerIds: [], geojson: null };

  try {
    let geojson;

    switch (layer.type) {
      case 'geojson':
        geojson = await loadGeoJSON(layer);
        break;
      case 'arcgis':
        geojson = await loadArcGIS(layer);
        break;
      case 'sheets':
        geojson = await loadGoogleSheets(layer);
        break;
      default:
        throw new Error(`Unknown layer type: "${layer.type}"`);
    }

    const count = geojson?.features?.length ?? 0;

    const mapLayerIds = addLayerToMap(map, layer, geojson);
    layerRegistry[layer.id].mapLayerIds = mapLayerIds;
    layerRegistry[layer.id].geojson = geojson;

    // Apply initial visibility
    setLayerVisibility(map, mapLayerIds, layer.visible !== false);

    setLayerStatus(layer.id, 'ok', `${count.toLocaleString()} features`);

  } catch (err) {
    console.error(`[urban-webmap] Failed to load layer "${layer.id}":`, err);
    setLayerStatus(layer.id, 'error', err.message);
  }
}
