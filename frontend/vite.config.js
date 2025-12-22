import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	build: {
		// Increase chunk size warning limit
		chunkSizeWarningLimit: 600,
		// Use esbuild for minification (faster than terser)
		minify: 'esbuild',
		esbuild: {
			drop: ['console', 'debugger']
		},
		// Disable source maps in production to reduce bundle size
		sourcemap: false,
		// Optimize asset inlining threshold (4KB is good balance)
		assetsInlineLimit: 4096,
		// Target modern browsers for smaller output (es2020 provides good balance)
		target: 'es2020',
		// Manual chunk splitting for better caching and parallel loading
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Split node_modules into separate chunks
					if (id.includes('node_modules')) {
						// Core React libraries - loaded on every page
						if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
							return 'react-vendor';
						}
						// Large animation library - lazy loaded
						if (id.includes('framer-motion')) {
							return 'framer-motion';
						}
						// Large chart library - only used on admin page
						if (id.includes('recharts')) {
							return 'recharts';
						}
						// UI libraries
						if (id.includes('lucide-react') || id.includes('react-hot-toast') || id.includes('react-confetti')) {
							return 'ui-vendor';
						}
						// State management and HTTP
						if (id.includes('zustand') || id.includes('axios')) {
							return 'core-utils';
						}
						// Other node_modules go into a separate chunk
						return 'vendor';
					}
				},
				// Optimize chunk file names for better caching
				chunkFileNames: 'assets/[name]-[hash].js',
				entryFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]'
			}
		}
	},
	// Optimize dependencies for faster cold starts
	optimizeDeps: {
		include: [
			'react', 
			'react-dom', 
			'react-router-dom',
			'zustand',
			'axios'
		]
	}
});