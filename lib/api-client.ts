import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
let API_BASE_URL = 'http://41.199.252.107:3000/api';
const TOKEN_KEY = '@selrs_auth_token';
const API_URL_KEY = '@selrs_api_url';
const API_TIMEOUT = 5000; // 5 seconds timeout

// Fetch with timeout
function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('API request timeout')), API_TIMEOUT)
    )
  ]);
}

// Initialize API URL from storage
export async function initializeApiUrl(): Promise<void> {
  try {
    const url = await AsyncStorage.getItem(API_URL_KEY);
    if (url) {
      API_BASE_URL = `${url}/api`;
    }
  } catch (error) {
    console.error('Failed to initialize API URL:', error);
  }
}

// Update API URL dynamically
export function setApiBaseUrl(url: string): void {
  API_BASE_URL = `${url}/api`;
}

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface KhazinaItem {
  ID?: number;
  التاريخ: string;
  الايراد: number;
  المصروف: number;
  ملاحظات: string;
  الرصيد?: number;
}

export interface SulfItem {
  ID?: number;
  الاسم: string;
  التاريخ: string;
  سداد: number;
  سلفه: number;
  ملاحظات: string;
  الاجمالي?: number;
}

export interface QardItem {
  ID?: number;
  الاسم: string;
  التاريخ: string;
  المبلغ: number;
  سداد: number;
  ملاحظات: string;
  المتبقي?: number;
}

export interface BaitItem {
  ID?: number;
  الاسم: string;
  التاريخ: string;
  معاه: number;
  منه: number;
  ملاحظات: string;
}

export interface InstapayItem {
  ID?: number;
  الاسم: string;
  التاريخ: string;
  معاه: number;
  منه: number;
  ملاحظات: string;
}

// Authentication
export async function login(username: string, password: string): Promise<string> {
  try {
    console.log('[API] Attempting login at:', API_BASE_URL + '/login');
    const response = await fetchWithTimeout(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    console.log('[API] Login response status:', response.status, 'data:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Save token
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    console.log('[API] Login successful, token saved');

    return data.token;
  } catch (error) {
    console.error('[API] Login error:', error);
    throw error;
  }
}

export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// Generic API request
async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<ApiResponse<T>> {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Khazina API
export const khazinaApi = {
  getAll: (year?: number) => 
    apiRequest<KhazinaItem[]>(`/khazina${year ? `?year=${year}` : ''}`),
  
  getById: (id: number) => 
    apiRequest<KhazinaItem>(`/khazina/${id}`),
  
  create: (item: Omit<KhazinaItem, 'ID'>) => 
    apiRequest(`/khazina`, 'POST', {
      date: item.التاريخ,
      revenue: item.الايراد,
      expense: item.المصروف,
      notes: item.ملاحظات,
    }),
  
  update: (id: number, item: Omit<KhazinaItem, 'ID'>) => 
    apiRequest(`/khazina/${id}`, 'PUT', {
      date: item.التاريخ,
      revenue: item.الايراد,
      expense: item.المصروف,
      notes: item.ملاحظات,
    }),
  
  delete: (id: number) => 
    apiRequest(`/khazina/${id}`, 'DELETE'),
};

// Sulf API
export const sulfApi = {
  getAll: () => 
    apiRequest<SulfItem[]>('/sulf'),
  
  getById: (id: number) => 
    apiRequest<SulfItem>(`/sulf/${id}`),
  
  create: (item: Omit<SulfItem, 'ID'>) => 
    apiRequest('/sulf', 'POST', {
      name: item.الاسم,
      date: item.التاريخ,
      payment: item.سداد,
      advance: item.سلفه,
      notes: item.ملاحظات,
    }),
  
  update: (id: number, item: Omit<SulfItem, 'ID'>) => 
    apiRequest(`/sulf/${id}`, 'PUT', {
      name: item.الاسم,
      date: item.التاريخ,
      payment: item.سداد,
      advance: item.سلفه,
      notes: item.ملاحظات,
    }),
  
  delete: (id: number) => 
    apiRequest(`/sulf/${id}`, 'DELETE'),
};

// Qard API
export const qardApi = {
  getAll: () => 
    apiRequest<QardItem[]>('/qard'),
  
  getById: (id: number) => 
    apiRequest<QardItem>(`/qard/${id}`),
  
  create: (item: Omit<QardItem, 'ID'>) => 
    apiRequest('/qard', 'POST', {
      name: item.الاسم,
      date: item.التاريخ,
      amount: item.المبلغ,
      payment: item.سداد,
      notes: item.ملاحظات,
    }),
  
  update: (id: number, item: Omit<QardItem, 'ID'>) => 
    apiRequest(`/qard/${id}`, 'PUT', {
      name: item.الاسم,
      date: item.التاريخ,
      amount: item.المبلغ,
      payment: item.سداد,
      notes: item.ملاحظات,
    }),
  
  delete: (id: number) => 
    apiRequest(`/qard/${id}`, 'DELETE'),
};

// Bait API
export const baitApi = {
  getAll: () => 
    apiRequest<BaitItem[]>('/bait'),
  
  getById: (id: number) => 
    apiRequest<BaitItem>(`/bait/${id}`),
  
  create: (item: Omit<BaitItem, 'ID'>) => 
    apiRequest('/bait', 'POST', {
      name: item.الاسم,
      date: item.التاريخ,
      advance: item.معاه,
      payment: item.منه,
      notes: item.ملاحظات,
    }),
  
  update: (id: number, item: Omit<BaitItem, 'ID'>) => 
    apiRequest(`/bait/${id}`, 'PUT', {
      name: item.الاسم,
      date: item.التاريخ,
      advance: item.معاه,
      payment: item.منه,
      notes: item.ملاحظات,
    }),
  
  delete: (id: number) => 
    apiRequest(`/bait/${id}`, 'DELETE'),
};

// InstaPay API
export const instapayApi = {
  getAll: () => 
    apiRequest<InstapayItem[]>('/instapay'),
  
  getById: (id: number) => 
    apiRequest<InstapayItem>(`/instapay/${id}`),
  
  create: (item: Omit<InstapayItem, 'ID'>) => 
    apiRequest('/instapay', 'POST', {
      name: item.الاسم,
      date: item.التاريخ,
      advance: item.معاه,
      payment: item.منه,
      notes: item.ملاحظات,
    }),
  
  update: (id: number, item: Omit<InstapayItem, 'ID'>) => 
    apiRequest(`/instapay/${id}`, 'PUT', {
      name: item.الاسم,
      date: item.التاريخ,
      advance: item.معاه,
      payment: item.منه,
      notes: item.ملاحظات,
    }),
  
  delete: (id: number) => 
    apiRequest(`/instapay/${id}`, 'DELETE'),
};

// Health check
export async function checkApiHealth(): Promise<boolean> {
  try {
    console.log('[API] Testing health check at:', API_BASE_URL + '/health');
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('[API] Health check response:', data);
    return data.status === 'ok';
  } catch (error) {
    console.error('[API] Health check failed:', error);
    return false;
  }
}
