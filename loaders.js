// =============================================================
//  loaders.js — fetches data for each source type
// =============================================================

/**
 * Load a GeoJSON layer config → GeoJSON FeatureCollection
 */
export async function loadGeoJSON(layer) {
  const res = await fetch(layer.url);
  if (!res.ok) throw new Error(`GeoJSON fetch failed for "${layer.id}": ${res.status}`);
  return await res.json();
}

/**
 * Load an ArcGIS REST FeatureServer / MapServer layer → GeoJSON FeatureCollection
 * Handles pagination so you get all features even past the server's maxRecordCount cap.
 */
export async function loadArcGIS(layer) {
  const base = layer.url.replace(/\/$/, '');
  const where = layer.where || '1=1';
  const max = layer.maxRecordCount || 1000;

  // First request: ask for objectIds only (fast, no geometry)
  const idsUrl = new URL(`${base}/query`);
  idsUrl.searchParams.set('where', where);
  idsUrl.searchParams.set('returnIdsOnly', 'true');
  idsUrl.searchParams.set('f', 'json');

  const idsRes = await fetch(idsUrl.toString());
  if (!idsRes.ok) throw new Error(`ArcGIS objectIds fetch failed for "${layer.id}": ${idsRes.status}`);
  const idsData = await idsRes.json();

  if (idsData.error) {
    throw new Error(`ArcGIS error for "${layer.id}": ${idsData.error.message}`);
  }

  const allIds = idsData.objectIds || [];
  if (allIds.length === 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  // Paginate: fetch features in chunks
  const chunks = [];
  for (let i = 0; i < allIds.length; i += max) {
    chunks.push(allIds.slice(i, i + max));
  }

  const allFeatures = [];
  for (const chunk of chunks) {
    const queryUrl = new URL(`${base}/query`);
    queryUrl.searchParams.set('objectIds', chunk.join(','));
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('f', 'geojson');

    const res = await fetch(queryUrl.toString());
    if (!res.ok) throw new Error(`ArcGIS features fetch failed for "${layer.id}": ${res.status}`);
    const data = await res.json();
    if (data.features) allFeatures.push(...data.features);
  }

  return { type: 'FeatureCollection', features: allFeatures };
}

/**
 * Load a Google Sheet published as CSV → GeoJSON FeatureCollection (points)
 * The sheet must have lat + lng columns (names configured via layer.latField / layer.lngField).
 */
export async function loadGoogleSheets(layer) {
  const res = await fetch(layer.url);
  if (!res.ok) throw new Error(`Google Sheets fetch failed for "${layer.id}": ${res.status}`);
  const csv = await res.text();

  const features = parseCSVtoFeatures(csv, layer.latField || 'lat', layer.lngField || 'lng');
  return { type: 'FeatureCollection', features };
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVtoFeatures(csv, latField, lngField) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]);
  const latIdx = findColIndex(headers, latField);
  const lngIdx = findColIndex(headers, lngField);

  if (latIdx === -1 || lngIdx === -1) {
    console.warn(
      `Google Sheets loader: could not find lat/lng columns. ` +
      `Found: [${headers.join(', ')}]. ` +
      `Expected: "${latField}" and "${lngField}". ` +
      `Check your config's latField/lngField settings.`
    );
    return [];
  }

  const features = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    if (row.length < headers.length) continue;

    const lat = parseFloat(row[latIdx]);
    const lng = parseFloat(row[lngIdx]);
    if (isNaN(lat) || isNaN(lng)) continue;

    const properties = {};
    headers.forEach((h, idx) => {
      if (idx !== latIdx && idx !== lngIdx) {
        properties[h] = row[idx];
      }
    });

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties,
    });
  }

  return features;
}

function parseCSVRow(line) {
  // Handles quoted fields with embedded commas
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function findColIndex(headers, name) {
  const lower = name.toLowerCase();
  return headers.findIndex(h => h.toLowerCase() === lower);
}
