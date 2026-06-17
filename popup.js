// =============================================================
//  popup.js — feature click popup
// =============================================================

let activePopup = null;

export function initPopup(map, layerRegistry) {
  const popupEl = document.getElementById('custom-popup');
  const popupContent = document.getElementById('popup-content');
  const popupClose = document.getElementById('popup-close');

  popupClose.addEventListener('click', () => hidePopup(popupEl));

  // Click handler for all registered layers
  map.on('click', (e) => {
    const layerIds = Object.values(layerRegistry).flatMap(r => r.mapLayerIds);
    const features = map.queryRenderedFeatures(e.point, { layers: layerIds.filter(id => map.getLayer(id)) });

    if (!features.length) {
      hidePopup(popupEl);
      return;
    }

    const feature = features[0];

    // Find the layer config for this feature
    const sourceId = feature.source;
    const layerId = Object.keys(layerRegistry).find(
      k => layerRegistry[k].mapLayerIds.some(id => {
        const l = map.getLayer(id);
        return l && l.source === sourceId;
      })
    );

    const layerConfig = layerRegistry[layerId]?.config || null;
    const props = feature.properties || {};

    popupContent.innerHTML = buildPopupHTML(props, layerConfig);
    showPopup(popupEl, e.point, map);
  });

  // Cursor changes
  map.on('mousemove', (e) => {
    const layerIds = Object.values(layerRegistry).flatMap(r => r.mapLayerIds);
    const features = map.queryRenderedFeatures(e.point, { layers: layerIds.filter(id => map.getLayer(id)) });
    map.getCanvas().style.cursor = features.length ? 'pointer' : '';
  });

  map.on('mouseleave', () => {
    map.getCanvas().style.cursor = '';
  });
}

function buildPopupHTML(props, layerConfig) {
  const fields = layerConfig?.popupFields || Object.keys(props);
  const title = layerConfig?.labelField ? props[layerConfig.labelField] : null;

  let html = '';
  if (title) html += `<h4>${escapeHTML(title)}</h4>`;

  const rows = fields
    .filter(f => props[f] !== null && props[f] !== undefined && props[f] !== '')
    .map(f => {
      const label = formatLabel(f);
      const value = escapeHTML(String(props[f]));
      return `<tr><th>${label}</th><td>${value}</td></tr>`;
    });

  if (rows.length) {
    html += `<table class="popup-table">${rows.join('')}</table>`;
  } else {
    html += `<p class="popup-empty">No attributes</p>`;
  }

  return html;
}

function showPopup(popupEl, point, map) {
  const mapEl = map.getCanvas();
  const rect = mapEl.getBoundingClientRect();

  // Position popup; keep it inside the map area
  let x = rect.left + point.x + 12;
  let y = rect.top + point.y - 12;

  popupEl.style.left = `${x}px`;
  popupEl.style.top = `${y}px`;
  popupEl.classList.remove('hidden');

  // Nudge if it'd overflow right
  requestAnimationFrame(() => {
    const pw = popupEl.offsetWidth;
    const ph = popupEl.offsetHeight;
    if (x + pw > window.innerWidth - 16) {
      popupEl.style.left = `${rect.left + point.x - pw - 12}px`;
    }
    if (y + ph > window.innerHeight - 16) {
      popupEl.style.top = `${rect.top + point.y - ph - 12}px`;
    }
  });
}

function hidePopup(popupEl) {
  popupEl.classList.add('hidden');
}

function formatLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
