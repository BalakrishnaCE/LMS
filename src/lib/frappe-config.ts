/**
 * Configuration for the Frappe backend connection
 */
export const frappeConfig = {
  // Replace with actual Frappe server URL for production
  url: import.meta.env.VITE_FRAPPE_URL || 'http://10.80.4.53',
  
  // Socket connection for real-time updates (replace port for production)
  socketPort: import.meta.env.VITE_FRAPPE_SOCKET_PORT || 9000,
  
  // Set to false in production for better security
  enableSocket: true,
  
  // HTTP request configuration
  tokenParams: {},
  
  // Connection options
  connectionOptions: {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },
};

// Additional Frappe API endpoints that might be needed
export const frappeEndpoints = {
  login: '/api/method/login',
  logout: '/api/method/logout',
  getModuleContent: '/api/method/novel_lms.api.get_module_content',
  saveModuleContent: '/api/method/novel_lms.api.save_module_content',
  getH5PContent: '/api/method/novel_lms.api.get_h5p_content',
  saveH5PContent: '/api/method/novel_lms.api.save_h5p_content',
};