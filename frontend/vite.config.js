import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					'react-vendor': ['react', 'react-dom', 'react-router-dom'],
					'ui-vendor': ['framer-motion', 'lucide-react'],
					'charts': ['recharts'],
				},
			},
		},
		chunkSizeWarningLimit: 1000,
		minify: 'esbuild',
	},
});
