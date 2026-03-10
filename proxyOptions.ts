// @ts-ignore - CommonJS require for JSON config file
const common_site_config = require('../../../sites/common_site_config.json');
const { webserver_port } = common_site_config;

export default {

	'/api': {
		target: `http://127.0.0.1:${webserver_port}`,
		changeOrigin: true,
		secure: false,
		configure: (proxy: any) => {
			proxy.on('proxyReq', (proxyReq: any, req: any) => {
				// Set Host header to lms.local so Frappe knows which site to use
				proxyReq.setHeader('Host', 'lms.local');
				// Override the X-Frappe-Site-Name header set by frappe-react-sdk
				proxyReq.setHeader('X-Frappe-Site-Name', 'lms.local');

				// Forward cookies from the request
				if (req.headers.cookie) {
					proxyReq.setHeader('Cookie', req.headers.cookie);
				}
			});
			proxy.on('proxyRes', (proxyRes: any, req: any) => {
				// Rewrite cookie domain and secure flags for development
				const cookies = proxyRes.headers['set-cookie'];
				if (cookies) {
					proxyRes.headers['set-cookie'] = cookies.map((cookie: string) => {
						// Remove Secure flag for HTTP development server
						return cookie.replace(/;\s*Secure/gi, '')
							.replace(/;\s*SameSite=None/gi, '; SameSite=Lax');
					});
				}
				// Set CORS headers
				proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
				const origin = req.headers.origin;
				if (origin) {
					proxyRes.headers['Access-Control-Allow-Origin'] = origin;
				}
			});
		}
	},
	'^/(app|assets|files|private)': {
		target: `http://127.0.0.1:${webserver_port}`,
		ws: true,
		changeOrigin: true,
		secure: false,
		cookieDomainRewrite: '',
		cookiePathRewrite: '/',
		configure: (proxy: any) => {
			proxy.on('proxyReq', (proxyReq: any, req: any) => {
				// Set Host header to production domain so Frappe knows which site to use
				proxyReq.setHeader('Host', 'lms.noveloffice.org');

				// Forward cookies
				if (req.headers.cookie) {
					proxyReq.setHeader('Cookie', req.headers.cookie);
				}
			});
			proxy.on('proxyRes', (proxyRes: any, req: any) => {
				// Allow credentials
				proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
				// Set CORS origin to match the request origin
				const origin = req.headers.origin;
				if (origin) {
					proxyRes.headers['Access-Control-Allow-Origin'] = origin;
				}
			});
		}
	}
};
