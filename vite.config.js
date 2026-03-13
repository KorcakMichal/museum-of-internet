import { defineConfig } from 'vite';

export default defineConfig({
  // Exposes PIXELLAB_SECRET_TOKEN to import.meta.env for the PixelLab client call.
  envPrefix: ['VITE_', 'PIXELLAB_'],
});
