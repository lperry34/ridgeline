# Ridgeline

Plan mountaineering routes and explore open world terrain in stunning 3D. Built with React, Cesium, and Resium.

## What it does

- **3D terrain** – Navigate global terrain with mouse/touch (pan, zoom, rotate).
- **Search** – Camera flies to your selected search place/address.
- **Route planning** – Select “Create your route” and click on the map to add waypoints. Points connect and display stats for **distance** and **elevation gain**.

## Prerequisites

- **Node.js** 18+ (or 20+ recommended)

## Get up and running

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Start the dev server**

   ```bash
   npm run dev
   ```

3. **Build for production**

   ```bash
   npm run build
   ```

   Output is in `dist/`. Preview the production build with:

   ```bash
   npm run preview
   ```

## Tech stack

- **React** + **TypeScript** + **Vite**
- **Cesium** – 3D globe and terrain
- **Resium** – React components for Cesium
- **Tailwind CSS** – Styling
