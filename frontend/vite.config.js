import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	build: {
		// Optimize chunk splitting for better caching
		rollupOptions: {
			output: {
				manualChunks: {
					// Vendor chunk for core React libraries
					vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
					// Animation libraries (framer-motion is large)
					animations: ['framer-motion'],
					// Chart library (only loaded in admin)
					charts: ['recharts'],
					// UI utilities
					ui: ['lucide-react', 'react-hot-toast']
				}
			}
		},
		// Increase chunk size warning limit (chunks are intentional)
		chunkSizeWarningLimit: 600,
		// Use esbuild for minification to avoid optional terser dependency
		minify: 'esbuild',
		esbuild: {
			drop: ['console', 'debugger']
		}
	}
});
