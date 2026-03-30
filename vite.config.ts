import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import proxyOptions from './proxyOptions';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(),  tailwindcss()],
	server: {
		port: 8082,
		host: '0.0.0.0',
		proxy: proxyOptions,
		allowedHosts: ['lms.noveloffice.org'],
		cors: true,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
			'Access-Control-Allow-Credentials': 'true',
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src')
		}
	},
	build: {
		outDir: '../novel_lms/public/lms',
		emptyOutDir: true,
		target: 'es2015',
	},
});
