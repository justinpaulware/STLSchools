# Urban Planning Webmap

A clean, configurable web map built with [MapLibre GL JS](https://maplibre.org/) and [OpenFreeMap](https://openfreemap.org/) basemaps. Designed to serve data from three source types simultaneously:

- **GeoJSON** — local files or any remote URL
- **ArcGIS REST** — FeatureServer or MapServer layers (with automatic pagination)
- **Google Sheets** — published CSV sheets plotted as point layers

## Quick start

1. **Clone this repo** and open in VS Code (or any editor)
2. Edit **`js/config.js`** to configure your layers
3. Add any local GeoJSON files to the **`data/`** folder
4. Push to `main` — GitHub Actions deploys to GitHub Pages automatically

## Configuration

All map setup lives in `js/config.js`. Each entry in the `layers` array defines one layer.

### GeoJSON layer

```js
{
  id: 'my-layer',          // unique identifier
  label: 'My Layer',       // shown in sidebar
  type: 'geojson',
  url: 'data/my-data.geojson',   // local path or https:// URL
  geometryType: 'point',  // point | line | polygon
  visible: true,
  style: {
    color: '#E24B4A',
    strokeColor: '#ffffff',
    strokeWidth: 1.5,
    radius: 7,             // for points
    opacity: 0.9,
    fillOpacity: 0.15,     // for polygons
    lineDasharray: null,   // e.g. [4,2] for dashed lines
  },
  popupFields: null,       // null = show all fields, or ['field1','field2']
  labelField: 'name',      // field to use as map label (optional)
}
```

### ArcGIS REST layer

```js
{
  id: 'arcgis-layer',
  label: 'ArcGIS Layer',
  type: 'arcgis',
  url: 'https://services.arcgis.com/ORG/arcgis/rest/services/LAYER/FeatureServer/0',
  geometryType: 'polygon',
  visible: true,
  where: '1=1',            // ArcGIS WHERE clause
  maxRecordCount: 1000,    // max features per page (server cap varies)
  style: { ... },
  popupFields: null,
}
```

### Google Sheets layer

1. In your Google Sheet: **File → Share → Publish to web → Comma-separated values (.csv)**
2. Copy the published URL — it looks like `https://docs.google.com/spreadsheets/d/SHEET_ID/pub?output=csv`
3. Your sheet needs columns for latitude and longitude (default: `lat` and `lng`)

```js
{
  id: 'sheets-layer',
  label: 'Sheet Data',
  type: 'sheets',
  url: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?output=csv',
  latField: 'lat',         // column name for latitude
  lngField: 'lng',         // column name for longitude
  visible: true,
  style: { ... },
  popupFields: null,
}
```

## Styling

Each layer has a `style` object. Supported properties:

| Property | Applies to | Description |
|---|---|---|
| `color` | all | Main fill or stroke colour (hex) |
| `strokeColor` | point, polygon | Outline colour |
| `strokeWidth` | all | Outline width in pixels |
| `radius` | point | Circle radius in pixels |
| `opacity` | all | Overall opacity (0–1) |
| `fillOpacity` | polygon | Fill opacity separate from outline |
| `lineDasharray` | line | e.g. `[4, 2]` for dashed |

Opacity for any layer can also be adjusted at runtime using the **Style panel** (the ◆ Style button on the map).

## Basemaps

Four OpenFreeMap styles are available in the style panel:

| Name | Style |
|---|---|
| Liberty | `https://tiles.openfreemap.org/styles/liberty` |
| Bright | `https://tiles.openfreemap.org/styles/bright` |
| Positron | `https://tiles.openfreemap.org/styles/positron` |
| Dark | `https://tiles.openfreemap.org/styles/dark-matter` |

## GitHub Pages deployment

The included `.github/workflows/deploy.yml` deploys automatically on push to `main`.

**First-time setup:**
1. Go to your repo **Settings → Pages**
2. Under *Source*, select **GitHub Actions**
3. Push to `main` — your map will be live at `https://YOUR_USERNAME.github.io/REPO_NAME`

## Project structure

```
├── index.html
├── js/
│   ├── config.js      ← edit this to configure your map
│   ├── main.js        ← bootstrap / orchestration
│   ├── loaders.js     ← data fetching (GeoJSON / ArcGIS / Sheets)
│   ├── layers.js      ← MapLibre layer rendering
│   ├── popup.js       ← feature click popup
│   └── ui.js          ← sidebar and style panel
├── styles/
│   └── main.css
├── data/
│   ├── heritage-sites.geojson   ← example data
│   ├── zoning.geojson
│   └── transit-routes.geojson
└── .github/workflows/deploy.yml
```

## Browser support

Requires a browser with WebGL support (Chrome, Firefox, Safari, Edge — all modern versions).
