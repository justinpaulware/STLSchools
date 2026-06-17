// =============================================================
//  ui.js — sidebar, style panel, layer controls
// =============================================================

import { setLayerVisibility, setLayerOpacity } from './layers.js';

export function initUI(map, config, layerRegistry) {
  // Title
  document.getElementById('map-title').textContent = config.title || 'Urban Planning Map';
  document.getElementById('map-subtitle').textContent = config.subtitle || '';

  // Sidebar layer list
  renderLayerList(map, config.layers, layerRegistry);

  // Style panel toggle
  const styleBtn = document.getElementById('btn-style-panel');
  const stylePanel = document.getElementById('style-panel');
  styleBtn.addEventListener('click', () => {
    stylePanel.classList.toggle('hidden');
  });

  // Basemap switcher
  document.querySelectorAll('.basemap-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const styleUrl = btn.dataset.style;
      switchBasemap(map, styleUrl, config, layerRegistry);
      document.querySelectorAll('.basemap-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Fit bounds
  document.getElementById('btn-fit-bounds').addEventListener('click', () => {
    fitAllLayers(map, layerRegistry);
  });
}

// ── Layer list ────────────────────────────────────────────────────────────────

export function renderLayerList(map, layers, layerRegistry) {
  const container = document.getElementById('layer-list');
  const opacityContainer = document.getElementById('opacity-controls');
  container.innerHTML = '';
  opacityContainer.innerHTML = '';

  layers.forEach(layer => {
    // Visibility toggle row
    const row = document.createElement('div');
    row.className = 'layer-row';
    row.dataset.layerId = layer.id;

    const toggle = document.createElement('label');
    toggle.className = 'layer-toggle';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = layer.visible !== false;
    checkbox.setAttribute('aria-label', `Toggle ${layer.label}`);
    checkbox.addEventListener('change', () => {
      const reg = layerRegistry[layer.id];
      if (reg) setLayerVisibility(map, reg.mapLayerIds, checkbox.checked);
    });

    const swatch = document.createElement('span');
    swatch.className = 'layer-swatch';
    swatch.style.backgroundColor = layer.style?.color || '#888';
    swatch.style.borderRadius = layer.geometryType === 'line' ? '0' : '50%';
    if (layer.geometryType === 'line') {
      swatch.style.height = '3px';
      swatch.style.width = '18px';
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'layer-name';
    nameEl.textContent = layer.label;

    const badge = document.createElement('span');
    badge.className = `source-badge source-${layer.type}`;
    badge.textContent = layer.type;

    toggle.appendChild(checkbox);
    toggle.appendChild(swatch);
    toggle.appendChild(nameEl);
    row.appendChild(toggle);
    row.appendChild(badge);

    // Status indicator (loading / error / count)
    const status = document.createElement('span');
    status.className = 'layer-status';
    status.id = `status-${layer.id}`;
    status.textContent = '…';
    row.appendChild(status);

    container.appendChild(row);

    // Opacity slider (in style panel)
    const opRow = document.createElement('div');
    opRow.className = 'opacity-row';
    opRow.innerHTML = `
      <label class="opacity-label">${layer.label}</label>
      <input type="range" min="0" max="1" step="0.05" value="1"
             aria-label="Opacity for ${layer.label}" class="opacity-slider"
             data-layer-id="${layer.id}" />
      <span class="opacity-value">100%</span>
    `;
    const slider = opRow.querySelector('.opacity-slider');
    const valueEl = opRow.querySelector('.opacity-value');
    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      valueEl.textContent = `${Math.round(val * 100)}%`;
      const reg = layerRegistry[layer.id];
      if (reg) setLayerOpacity(map, layer, reg.mapLayerIds, val);
    });
    opacityContainer.appendChild(opRow);
  });
}

export function setLayerStatus(layerId, state, detail) {
  const el = document.getElementById(`status-${layerId}`);
  if (!el) return;
  el.className = `layer-status status-${state}`;
  el.title = detail || '';
  el.textContent = {
    loading: '⟳',
    ok: detail || '✓',
    error: '✗',
  }[state] || '';
}

// ── Basemap switcher ──────────────────────────────────────────────────────────

function switchBasemap(map, styleUrl, config, layerRegistry) {
  // Save current data sources so we can re-add layers after style reload
  const savedData = {};
  Object.entries(layerRegistry).forEach(([id, reg]) => {
    const src = map.getSource(`src-${id}`);
    if (src) savedData[id] = src._data;
  });

  map.setStyle(styleUrl);

  map.once('style.load', () => {
    // Re-add all layers with saved data
    import('./layers.js').then(({ addLayerToMap, setLayerVisibility }) => {
      config.layers.forEach(layer => {
        const data = savedData[layer.id];
        if (!data) return;
        const ids = addLayerToMap(map, layer, data);
        layerRegistry[layer.id].mapLayerIds = ids;
        setLayerVisibility(map, ids, layer.visible !== false);
      });
    });
  });
}

// ── Fit bounds ────────────────────────────────────────────────────────────────

function fitAllLayers(map, layerRegistry) {
  import('./layers.js').then(({ getGeoJSONBounds }) => {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

    Object.values(layerRegistry).forEach(reg => {
      if (!reg.geojson) return;
      const b = getGeoJSONBounds(reg.geojson);
      if (!b) return;
      minLng = Math.min(minLng, b[0]);
      minLat = Math.min(minLat, b[1]);
      maxLng = Math.max(maxLng, b[2]);
      maxLat = Math.max(maxLat, b[3]);
    });

    if (isFinite(minLng)) {
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 16 });
    }
  });
}
