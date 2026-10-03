import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDemo = String(env.DEMO_MODE || env.VITE_DEMO_MODE || process.env.DEMO_MODE || '').toLowerCase() === 'true';

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'DEMO_'],
    define: {
      'process.env': {},
      '__DEMO_MODE__': JSON.stringify(isDemo),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/preguntar': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'pages': path.resolve(__dirname, './src/pages'),
        'components': path.resolve(__dirname, './src/components'),
        'styles': path.resolve(__dirname, './src/styles'),
        'assets': path.resolve(__dirname, './src/assets'),
        'consultas': path.resolve(__dirname, './src/consultas'),
        'context': path.resolve(__dirname, './src/context'),
        'hooks': path.resolve(__dirname, './src/hooks'),
        'services': path.resolve(__dirname, './src/services'),
        'demo': path.resolve(__dirname, './src/demo'),
      },
    },
    build: {
      outDir: 'dist'
    }
  };
});
