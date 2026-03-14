import { defineConfig } from 'vite';

export default defineConfig({
  // Exposes selected env vars to import.meta.env for client-side service calls.
  envPrefix: ['VITE_', 'PIXELLAB_', 'OPENROUTER_'],
});
