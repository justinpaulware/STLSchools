// =============================================================
//  config.js — edit this file to configure your map layers
// =============================================================
//
//  Three data source types are supported:
//    1. "geojson"   — a local file or remote URL
//    2. "arcgis"    — an ArcGIS REST FeatureServer / MapServer layer
//    3. "sheets"    — a Google Sheet (must be published as CSV)
//
//  Google Sheets setup:
//    File → Share → Publish to web → choose "Comma-separated values (.csv)"
//    The URL looks like:
//    https://docs.google.com/spreadsheets/d/SHEET_ID/pub?output=csv
//    Your sheet needs columns: lat, lng (or longitude/latitude variations)
//    All other columns become popup attributes.
//
// =============================================================

window.MAP_CONFIG = {

  // Initial map view
  center: [144.9631, -37.8136],   // [lng, lat]  — Melbourne CBD
  zoom: 12,
  minZoom: 9,
  maxZoom: 20,

  // Default basemap (OpenFreeMap styles: liberty | bright | positron | dark-matter)
  basemapStyle: 'https://tiles.openfreemap.org/styles/liberty',

  // Map title shown in the sidebar
  title: 'Urban Planning Map',
  subtitle: 'Layer explorer',

  // ---------------------------------------------------------------
  // LAYERS — add, remove, or reorder entries here
  // ---------------------------------------------------------------
  layers: [

    // ── EXAMPLE 1: GeoJSON file (points) ──────────────────────────
    {
      id: 'heritage-sites',
      label: 'Heritage sites',
      type: 'geojson',
      url: 'data/heritage-sites.geojson',
      geometryType: 'point',       // point | line | polygon
      visible: true,
      style: {
        color: '#E24B4A',           // circle fill / line / polygon fill
        strokeColor: '#ffffff',     // circle stroke
        strokeWidth: 1.5,
        radius: 7,                  // for points
        opacity: 0.9,
        fillOpacity: 0.15,          // for polygons
      },
      // Which fields to show in the popup (null = show all)
      popupFields: null,
      // Optional label field
      labelField: 'name',
    },

    // ── EXAMPLE 2: GeoJSON file (polygons — e.g. zoning) ──────────
    {
      id: 'zoning',
      label: 'Zoning',
      type: 'geojson',
      url: 'data/zoning.geojson',
      geometryType: 'polygon',
      visible: true,
      style: {
        color: '#378ADD',
        strokeColor: '#0C447C',
        strokeWidth: 1,
        opacity: 1,
        fillOpacity: 0.2,
      },
      popupFields: ['zone_code', 'description', 'area_ha'],
      labelField: 'zone_code',
    },

    // ── EXAMPLE 3: GeoJSON file (lines — e.g. transit routes) ─────
    {
      id: 'transit-routes',
      label: 'Transit routes',
      type: 'geojson',
      url: 'data/transit-routes.geojson',
      geometryType: 'line',
      visible: false,
      style: {
        color: '#1D9E75',
        strokeWidth: 3,
        opacity: 0.85,
        lineDasharray: null,        // e.g. [4, 2] for dashed
      },
      popupFields: ['route_name', 'operator', 'frequency_min'],
    },

    // ── EXAMPLE 4: ArcGIS REST FeatureServer ──────────────────────
    {
      id: 'planning-zones',
      label: 'Planning zones (ArcGIS)',
      type: 'arcgis',
      // Paste your FeatureServer URL (without /query at the end):
      url: 'https://services.arcgis.com/YOUR_ORG/arcgis/rest/services/YOUR_LAYER/FeatureServer/0',
      geometryType: 'polygon',
      visible: false,
      style: {
        color: '#EF9F27',
        strokeColor: '#633806',
        strokeWidth: 1,
        opacity: 1,
        fillOpacity: 0.25,
      },
      // ArcGIS WHERE clause (use '1=1' for all features)
      where: '1=1',
      // Max features to fetch (ArcGIS default cap is 1000 or 2000)
      maxRecordCount: 1000,
      popupFields: null,
    },

    // ── EXAMPLE 5: Google Sheet (lat/lng points) ──────────────────
    {
      id: 'community-assets',
      label: 'Community assets (Sheets)',
      type: 'sheets',
      // File → Share → Publish to web → CSV link:
      url: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?output=csv',
      // Column names for coordinates (case-insensitive)
      latField: 'lat',
      lngField: 'lng',
      visible: false,
      style: {
        color: '#7F77DD',
        strokeColor: '#ffffff',
        strokeWidth: 1.5,
        radius: 8,
        opacity: 0.9,
      },
      popupFields: null,
    },

  ],
};
