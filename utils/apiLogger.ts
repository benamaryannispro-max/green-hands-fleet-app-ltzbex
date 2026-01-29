
/**
 * API Logger Utility
 * 
 * This utility helps debug API calls and responses.
 * Enable detailed logging by setting DEBUG_API to true.
 */

export const DEBUG_API = __DEV__; // Only log in development

export const logApiCall = (method: string, endpoint: string, data?: any) => {
  if (!DEBUG_API) return;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔵 API CALL: ${method} ${endpoint}`);
  if (data) {
    console.log('📤 Request Data:', JSON.stringify(data, null, 2));
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};

export const logApiResponse = (method: string, endpoint: string, response: any) => {
  if (!DEBUG_API) return;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🟢 API SUCCESS: ${method} ${endpoint}`);
  console.log('📥 Response Data:', JSON.stringify(response, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};

export const logApiError = (method: string, endpoint: string, error: any) => {
  if (!DEBUG_API) return;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔴 API ERROR: ${method} ${endpoint}`);
  console.log('❌ Error:', error);
  if (error.response) {
    console.log('📥 Response Status:', error.response.status);
    console.log('📥 Response Data:', error.response.data);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};

export const logAuthEvent = (event: string, details?: any) => {
  if (!DEBUG_API) return;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔐 AUTH EVENT: ${event}`);
  if (details) {
    console.log('Details:', JSON.stringify(details, null, 2));
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};

export const logLocationUpdate = (latitude: number, longitude: number, shiftId: string) => {
  if (!DEBUG_API) return;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 LOCATION UPDATE`);
  console.log(`Shift ID: ${shiftId}`);
  console.log(`Coordinates: ${latitude}, ${longitude}`);
  console.log(`Time: ${new Date().toLocaleTimeString('fr-FR')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};
