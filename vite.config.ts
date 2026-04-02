import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

/** Yalnızca production build çıktısına: mixed content önleme + sıkı CSP (HMR’ı bozmamak için dev’de yok). */
function securityHeadersPlugin(command: string): Plugin {
  return {
    name: 'security-headers',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (command !== 'build') return html;
        const csp = [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' https: data: blob:",
          "font-src 'self' https://fonts.gstatic.com data:",
          "connect-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          'upgrade-insecure-requests',
        ].join('; ');
        return html.replace(
          /<meta charset="UTF-8" \/>/,
          `$&\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
        );
      },
    },
  };
}

export default defineConfig(({mode, command}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      securityHeadersPlugin(command),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        manifest: {
          name: 'Burger34',
          short_name: 'Burger34',
          description: 'Burger34 ozel burger deneyimi',
          theme_color: '#5a0f1f',
          background_color: '#0f0f10',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/logo_final_vectorized.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/logo_final_vectorized.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,mp4}'],
          globIgnores: ['**/art.png'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: ({request}) => request.destination === 'image' || request.destination === 'video',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'media-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
