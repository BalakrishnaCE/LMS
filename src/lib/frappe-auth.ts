import axios from 'axios';
import { frappeConfig } from './frappe-config';

export async function loginToFrappe(username: string, password: string) {
  try {
    const response = await axios.post(
      `${frappeConfig.url}/api/method/login`,
      {
        usr: username,
        pwd: password
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      }
    );


    return {
      success: true,
      data: response.data,
      message: "Successfully logged in"
    };
  } catch (error) {
    console.error('Frappe login error:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred during login"
    };
  }
}


export async function logoutFromFrappe() {
  try {
    const response = await axios.post(
      `${frappeConfig.url}/api/method/logout`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      }
    );
    
    return {
      success: true,
      data: response.data,
      message: "Successfully logged out"
    };
  } catch (error) {
    console.error('Frappe logout error:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred during logout"
    };
  }
}


export async function getCurrentFrappeUser() {
  try {
    const response = await axios.get(
      `${frappeConfig.url}/api/method/frappe.auth.get_logged_user`,
      {
        headers: {
          'Accept': 'application/json'
        },
        withCredentials: true
      }
    );
    
    return {
      success: true,
      user: response.data.message,
      message: "Successfully retrieved user"
    };
  } catch (error) {
    console.error('Error getting current Frappe user:', error);
    
    return {
      success: false,
      user: null,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}