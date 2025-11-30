import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Cast process to any to avoid TypeScript error: Property 'cwd' does not exist on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Use the API key provided or fallback to the env variable
  const apiKey = env.API_KEY || 'AIzaSyC1TBIC-9tTXc6hLHcJqM-PWNR-zsNuNPY';

  return {
    plugins: [react()],
    define: {
      // Safely expose the API_KEY to the client
      'process.env.API_KEY': JSON.stringify(apiKey),
    }
  };
});