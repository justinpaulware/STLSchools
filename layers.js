// =============================================================
//  layers.js — adds/removes MapLibre GL layers from the map
// =============================================================

/**
 * Add a loaded GeoJSON FeatureCollection to the map.
 * Creates a source + one or more paint layers.
 * Returns the array of MapLibre layer IDs added.
 */
export function addLayerToMap(map, layer, geojson) {
  const sourceId = `src-${layer.id}`;

  // Add or update the source
  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(geojson);
  } else {
    map.addSource(sourceId, { type: 'geojson', data: geojson });
  }

  const addedLayerIds = [];

  switch (layer.geometryType) {
    case 'point':
      addedLayerIds.push(...addPointLayer(map, layer, sourceId));
      break;
    case 'line':
      addedLayerIds.push(...addLineLayer(map, layer, sourceId));
      break;
    case 'polygon':
      addedLayerIds.push(...addPolygonLayer(map, layer, sourceId));
      break;
    default:
      // Auto-detect from first feature
      addedLayerIds.push(...addAutoDetectedLayer(map, layer, sourceId, geojson));
  }

  // Labels
  if (layer.labelField) {
    const labelLayerId = `${layer.id}-labels`;
    if (!map.getLayer(labelLayerId)) {
      map.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['get', layer.labelField],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 11,
          'text-offset': [0, layer.geometryType === 'point' ? 1.2 : 0],
          'text-anchor': layer.geometryType === 'point' ? 'top' : 'center',
          'text-max-width': 8,
        },
        paint: {
          'text-color': '#1a1a1a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
        minzoom: 12,
      });
      addedLayerIds.push(labelLayerId);
    }
  }

  return addedLayerIds;
}

// ── Point layers ──────────────────────────────────────────────────────────────

function addPointLayer(map, layer, sourceId) {
  const s = layer.style || {};
  const layerId = `${layer.id}-circles`;

  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'],
          8,  Math.max(2, (s.radius || 6) * 0.5),
          14, s.radius || 6,
          18, (s.radius || 6) * 1.5,
        ],
        'circle-color': s.color || '#378ADD',
        'circle-opacity': s.opacity ?? 0.9,
        'circle-stroke-color': s.strokeColor || '#ffffff',
        'circle-stroke-width': s.strokeWidth ?? 1.5,
      },
    });
  }
  return [layerId];
}

// ── Line layers ───────────────────────────────────────────────────────────────

function addLineLayer(map, layer, sourceId) {
  const s = layer.style || {};
  const layerId = `${layer.id}-lines`;

  const paintProps = {
    'line-color': s.color || '#1D9E75',
    'line-width': ['interpolate', ['linear'], ['zoom'],
      8,  Math.max(1, (s.strokeWidth || 3) * 0.5),
      14, s.strokeWidth || 3,
    ],
    'line-opacity': s.opacity ?? 0.85,
  };

  if (s.lineDasharray) paintProps['line-dasharray'] = s.lineDasharray;

  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: paintProps,
    });
  }
  return [layerId];
}

// ── Polygon layers ────────────────────────────────────────────────────────────

function addPolygonLayer(map, layer, sourceId) {
  const s = layer.style || {};
  const fillId = `${layer.id}-fill`;
  const outlineId = `${layer.id}-outline`;

  if (!map.getLayer(fillId)) {
    map.addLayer({
      id: fillId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': s.color || '#378ADD',
        'fill-opacity': s.fillOpacity ?? 0.2,
      },
    });
  }

  if (!map.getLayer(outlineId)) {
    map.addLayer({
      id: outlineId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': s.strokeColor || s.color || '#0C447C',
        'line-width': s.strokeWidth ?? 1,
        'line-opacity': s.opacity ?? 1,
      },
    });
  }
  return [fillId, outlineId];
}

// ── Auto-detect from geometry type ───────────────────────────────────────────

function addAutoDetectedLayer(map, layer, sourceId, geojson) {
  const first = geojson?.features?.[0];
  if (!first) return [];
  const geomType = first.geometry?.type || '';

  if (geomType.includes('Point')) {
    return addPointLayer(map, { ...layer, geometryType: 'point' }, sourceId);
  } else if (geomType.includes('LineString')) {
    return addLineLayer(map, { ...layer, geometryType: 'line' }, sourceId);
  } else if (geomType.includes('Polygon')) {
    return addPolygonLayer(map, { ...layer, geometryType: 'polygon' }, sourceId);
  }
  return [];
}

// ── Visibility / opacity ──────────────────────────────────────────────────────

export function setLayerVisibility(map, mapLayerIds, visible) {
  const visibility = visible ? 'visible' : 'none';
  mapLayerIds.forEach(id => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility', visibility);
    }
  });
}

export function setLayerOpacity(map, layer, mapLayerIds, opacity) {
  mapLayerIds.forEach(id => {
    if (!map.getLayer(id)) return;
    const type = map.getLayer(id).type;
    const prop = {
      circle: 'circle-opacity',
      line: 'line-opacity',
      fill: 'fill-opacity',
      symbol: 'text-opacity',
    }[type];
    if (prop) map.setPaintProperty(id, prop, opacity);
    // Also adjust stroke opacity for circles
    if (type === 'circle') {
      map.setPaintProperty(id, 'circle-stroke-opacity', opacity);
    }
  });
}

// ── Bounds helpers ────────────────────────────────────────────────────────────

export function getGeoJSONBounds(geojson) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

  function processCoords(coords) {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number') {
      minLng = Math.min(minLng, coords[0]);
      maxLng = Math.max(maxLng, coords[0]);
      minLat = Math.min(minLat, coords[1]);
      maxLat = Math.max(maxLat, coords[1]);
    } else {
      coords.forEach(processCoords);
    }
  }

  (geojson.features || []).forEach(f => {
    if (f.geometry?.coordinates) processCoords(f.geometry.coordinates);
  });

  if (!isFinite(minLng)) return null;
  return [minLng, minLat, maxLng, maxLat];
}
