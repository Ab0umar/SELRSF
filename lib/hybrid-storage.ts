/**
 * Hybrid Storage Manager
 * 
 * Manages data storage with two modes:
 * 1. Offline Mode: Uses AsyncStorage (local device storage)
 * 2. API Mode: Uses remote API server connected to MS Access database
 * 
 * The app automatically falls back to offline mode if API is unreachable.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateToDDMMYYYY, formatDateToYYYYMMDD } from './date-utils';
import { 
  khazinaApi, 
  sulfApi, 
  qardApi, 
  baitApi,
  instapayApi,
  checkApiHealth, 
  getToken,
  type KhazinaItem as ApiKhazinaItem,
  type SulfItem as ApiSulfItem,
  type QardItem as ApiQardItem
} from './api-client';
import {
  getKhazinaItems as getOfflineKhazina,
  createKhazinaItem as createOfflineKhazina,
  updateKhazinaItem as updateOfflineKhazina,
  deleteKhazinaItem as deleteOfflineKhazina,
  getSulfItems as getOfflineSulf,
  createSulfItem as createOfflineSulf,
  updateSulfItem as updateOfflineSulf,
  deleteSulfItem as deleteOfflineSulf,
  getQardItems as getOfflineQard,
  createQardItem as createOfflineQard,
  updateQardItem as updateOfflineQard,
  deleteQardItem as deleteOfflineQard,
  clearKhazinaItems,
  clearSulfItems,
  clearQardItems,
  type KhazinaItem,
  type SulfItem,
  type QardItem,
} from './offline-storage';

// Re-export types
export type { KhazinaItem, SulfItem, QardItem };

// Import Bait and InstaPay functions
import {
  getBaitItems as getOfflineBait,
  createBaitItem as createOfflineBait,
  updateBaitItem as updateOfflineBait,
  deleteBaitItem as deleteOfflineBait,
  getInstapayItems as getOfflineInstapay,
  createInstapayItem as createOfflineInstapay,
  updateInstapayItem as updateOfflineInstapay,
  deleteInstapayItem as deleteOfflineInstapay,
  clearBaitItems,
  clearInstapayItems,
  type BaitItem,
  type InstapayItem,
} from './offline-storage';

// Re-export types
export type { BaitItem, InstapayItem };

// Re-export clear functions
export { clearKhazinaItems, clearSulfItems, clearQardItems, clearBaitItems, clearInstapayItems };

const API_MODE_KEY = '@selrs_api_mode';
const API_URL_KEY = '@selrs_api_url';
const LAST_SYNC_KEY = '@selrs_last_sync';

// Storage mode type
export type StorageMode = 'offline' | 'api';

// Get current storage mode
export async function getStorageMode(): Promise<StorageMode> {
  try {
    const mode = await AsyncStorage.getItem(API_MODE_KEY);
    return (mode as StorageMode) || 'offline';
  } catch {
    return 'offline';
  }
}

// Set storage mode
export async function setStorageMode(mode: StorageMode): Promise<void> {
  await AsyncStorage.setItem(API_MODE_KEY, mode);
}

// Check if API is available
export async function isApiAvailable(): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) return false;
    
    return await checkApiHealth();
  } catch {
    return false;
  }
}

// Get API URL
export async function getApiUrl(): Promise<string> {
  try {
    const url = await AsyncStorage.getItem(API_URL_KEY);
    return url || 'http://192.168.1.100:3000';
  } catch {
    return 'http://192.168.1.100:3000';
  }
}

// Set API URL
export async function setApiUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(API_URL_KEY, url);
}

// Get last sync timestamp
export async function getLastSync(): Promise<Date | null> {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? new Date(timestamp) : null;
  } catch {
    return null;
  }
}

// Update last sync timestamp
async function updateLastSync(): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
}

// Convert API format to local format
function convertApiKhazinaToLocal(apiItem: any): KhazinaItem {
  let itemDate = '';
  
  // Handle date format: API sends DD/MM/YYYY
  if (typeof apiItem.التاريخ === 'string') {
    if (apiItem.التاريخ.includes('/')) {
      // Format: DD/MM/YYYY → convert to YYYY-MM-DD
      const [day, month, year] = apiItem.التاريخ.split('/').map(Number);
      itemDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else {
      itemDate = apiItem.التاريخ;
    }
  } else if (apiItem.التاريخ) {
    itemDate = new Date(apiItem.التاريخ).toISOString().split('T')[0];
  } else {
    itemDate = new Date().toISOString().split('T')[0];
  }
  
  const year = new Date(itemDate).getFullYear();
  const income = parseFloat(apiItem.revenue || apiItem.الايراد) || 0;
  const expense = parseFloat(apiItem.expense || apiItem.المصروف) || 0;
  
  return {
    id: apiItem.ID?.toString() || Date.now().toString(),
    year: year,
    date: formatDateToDDMMYYYY(itemDate),
    income: income,
    expense: expense,
    total: income - expense,
    balance: parseFloat(apiItem.الرصيد) || 0,
    notes: apiItem.ملاحظات || apiItem.H || '',
  };
}

function convertApiSulfToLocal(apiItem: any): SulfItem {
  let itemDate = '';
  
  // Handle date format: API sends DD/MM/YYYY
  if (typeof apiItem.التاريخ === 'string') {
    if (apiItem.التاريخ.includes('/')) {
      const [day, month, year] = apiItem.التاريخ.split('/').map(Number);
      itemDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else {
      itemDate = apiItem.التاريخ;
    }
  } else if (apiItem.التاريخ) {
    itemDate = new Date(apiItem.التاريخ).toISOString().split('T')[0];
  } else {
    itemDate = new Date().toISOString().split('T')[0];
  }
  
  return {
    id: apiItem.ID?.toString() || Date.now().toString(),
    name: apiItem.الاسم || '',
    date: formatDateToDDMMYYYY(itemDate),
    payment: apiItem.سداد || 0,
    advance: apiItem.سلفه || 0,
    notes: apiItem.ملاحظات || '',
  };
}

function convertApiQardToLocal(apiItem: any): QardItem {
  let itemDate = '';
  
  // Handle date format: API sends DD/MM/YYYY
  if (typeof apiItem.التاريخ === 'string') {
    if (apiItem.التاريخ.includes('/')) {
      const [day, month, year] = apiItem.التاريخ.split('/').map(Number);
      itemDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else {
      itemDate = apiItem.التاريخ;
    }
  } else if (apiItem.التاريخ) {
    itemDate = new Date(apiItem.التاريخ).toISOString().split('T')[0];
  } else {
    itemDate = new Date().toISOString().split('T')[0];
  }
  
  return {
    id: apiItem.ID?.toString() || Date.now().toString(),
    name: apiItem.الاسم || '',
    date: formatDateToDDMMYYYY(itemDate),
    amount: apiItem.المبلغ || 0,
    payment: apiItem.سداد || 0,
    notes: apiItem.ملاحظات || '',
  };
}

// ==================== KHAZINA OPERATIONS ====================

export async function getKhazinaItems(year?: number): Promise<KhazinaItem[]> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const response = await khazinaApi.getAll(year);
      if (response.success && response.data) {
        await updateLastSync();
        return response.data.map(convertApiKhazinaToLocal);
      }
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  return await getOfflineKhazina(year || new Date().getFullYear());
}

export async function createKhazinaItem(item: Omit<KhazinaItem, 'id'>): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      await khazinaApi.create({
        التاريخ: item.date || new Date().toISOString().split('T')[0],
        الايراد: item.income || 0,
        المصروف: item.expense || 0,
        ملاحظات: item.notes || '',
      });
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await createOfflineKhazina(item);
}

export async function updateKhazinaItem(id: string, item: Omit<KhazinaItem, 'id'>): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) throw new Error('Invalid ID');
      
      await khazinaApi.update(numId, {
        التاريخ: item.date || new Date().toISOString().split('T')[0],
        الايراد: item.income || 0,
        المصروف: item.expense || 0,
        ملاحظات: item.notes || '',
      });
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await updateOfflineKhazina(id, item);
}

export async function deleteKhazinaItem(id: string): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) throw new Error('Invalid ID');
      await khazinaApi.delete(numId);
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await deleteOfflineKhazina(id);
}

// ==================== SULF OPERATIONS ====================

export async function getSulfItems(): Promise<SulfItem[]> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const response = await sulfApi.getAll();
      if (response.success && response.data) {
        await updateLastSync();
        return response.data.map(convertApiSulfToLocal);
      }
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  return await getOfflineSulf();
}

export async function createSulfItem(item: Omit<SulfItem, 'id'>): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      await sulfApi.create({
        الاسم: item.name || '',
        التاريخ: item.date || new Date().toISOString().split('T')[0],
        سداد: item.payment || 0,
        سلفه: item.advance || 0,
        ملاحظات: item.notes || '',
      });
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await createOfflineSulf(item);
}

export async function updateSulfItem(id: string, item: Omit<SulfItem, 'id'>): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) throw new Error('Invalid ID');
      
      await sulfApi.update(numId, {
        الاسم: item.name || '',
        التاريخ: item.date || new Date().toISOString().split('T')[0],
        سداد: item.payment || 0,
        سلفه: item.advance || 0,
        ملاحظات: item.notes || '',
      });
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await updateOfflineSulf(id, item);
}

export async function deleteSulfItem(id: string): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) throw new Error('Invalid ID');
      await sulfApi.delete(numId);
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await deleteOfflineSulf(id);
}

// ==================== QARD OPERATIONS ====================

export async function getQardItems(): Promise<QardItem[]> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const response = await qardApi.getAll();
      if (response.success && response.data) {
        await updateLastSync();
        return response.data.map(convertApiQardToLocal);
      }
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  return await getOfflineQard();
}

export async function createQardItem(item: Omit<QardItem, 'id'>): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      await qardApi.create({
        الاسم: item.name || '',
        التاريخ: item.date || new Date().toISOString().split('T')[0],
        المبلغ: item.amount || 0,
        سداد: item.payment || 0,
        ملاحظات: item.notes || '',
      });
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await createOfflineQard(item);
}

export async function updateQardItem(id: string, item: Omit<QardItem, 'id'>): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) throw new Error('Invalid ID');
      
      await qardApi.update(numId, {
        الاسم: item.name || '',
        التاريخ: item.date || new Date().toISOString().split('T')[0],
        المبلغ: item.amount || 0,
        سداد: item.payment || 0,
        ملاحظات: item.notes || '',
      });
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await updateOfflineQard(id, item);
}

export async function deleteQardItem(id: string): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) throw new Error('Invalid ID');
      await qardApi.delete(numId);
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await deleteOfflineQard(id);
}


// ==================== BAIT OPERATIONS ====================

function convertApiBaitToLocal(apiItem: any): BaitItem {
  let itemDate = '';
  
  // Handle date format: API sends DD/MM/YYYY
  if (typeof apiItem.التاريخ === 'string') {
    if (apiItem.التاريخ.includes('/')) {
      const [day, month, year] = apiItem.التاريخ.split('/').map(Number);
      itemDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else {
      itemDate = apiItem.التاريخ;
    }
  } else if (typeof apiItem.date === 'string') {
    if (apiItem.date.includes('/')) {
      const [day, month, year] = apiItem.date.split('/').map(Number);
      itemDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else {
      itemDate = apiItem.date;
    }
  } else if (apiItem.التاريخ || apiItem.date) {
    itemDate = new Date(apiItem.التاريخ || apiItem.date).toISOString().split('T')[0];
  } else {
    itemDate = new Date().toISOString().split('T')[0];
  }
  
  return {
    id: apiItem.ID?.toString() || apiItem.id?.toString() || Date.now().toString(),
    name: apiItem.الاسم || apiItem.name || '',
    date: formatDateToDDMMYYYY(itemDate),
    advance: parseFloat(apiItem.معاه || 0),
    payment: parseFloat(apiItem.منه || 0),
    notes: apiItem.ملاحظات || apiItem.notes || '',
  };
}

export async function getBaitItems(): Promise<BaitItem[]> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const response = await baitApi.getAll();
      if (response.success && response.data) {
        await updateLastSync();
        return response.data.map(convertApiBaitToLocal);
      }
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  return await getOfflineBait();
}

export async function createBaitItem(item: Omit<BaitItem, 'id'>): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      await baitApi.create({
        الاسم: item.name || '',
        التاريخ: item.date || new Date().toISOString().split('T')[0],
        معاه: item.advance || 0,
        منه: item.payment || 0,
        ملاحظات: item.notes || '',
      });
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await createOfflineBait(item);
}

export async function updateBaitItem(id: string, item: Omit<BaitItem, 'id'>): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) throw new Error('Invalid ID');
      
      await baitApi.update(numId, {
        الاسم: item.name || '',
        التاريخ: item.date || new Date().toISOString().split('T')[0],
        معاه: item.advance || 0,
        منه: item.payment || 0,
        ملاحظات: item.notes || '',
      });
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await updateOfflineBait(id, item);
}

export async function deleteBaitItem(id: string): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) throw new Error('Invalid ID');
      await baitApi.delete(numId);
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await deleteOfflineBait(id);
}

// ==================== INSTAPAY OPERATIONS ====================

function convertApiInstapayToLocal(apiItem: any): InstapayItem {
  let itemDate = '';
  
  // Handle date format: API sends DD/MM/YYYY
  if (typeof apiItem.التاريخ === 'string') {
    if (apiItem.التاريخ.includes('/')) {
      const [day, month, year] = apiItem.التاريخ.split('/').map(Number);
      itemDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else {
      itemDate = apiItem.التاريخ;
    }
  } else if (typeof apiItem.date === 'string') {
    if (apiItem.date.includes('/')) {
      const [day, month, year] = apiItem.date.split('/').map(Number);
      itemDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else {
      itemDate = apiItem.date;
    }
  } else if (apiItem.التاريخ || apiItem.date) {
    itemDate = new Date(apiItem.التاريخ || apiItem.date).toISOString().split('T')[0];
  } else {
    itemDate = new Date().toISOString().split('T')[0];
  }
  
  return {
    id: apiItem.ID?.toString() || apiItem.id?.toString() || Date.now().toString(),
    name: apiItem.الاسم || apiItem.name || '',
    date: formatDateToDDMMYYYY(itemDate),
    advance: parseFloat(apiItem.معاه || 0),
    payment: parseFloat(apiItem.منه || 0),
    notes: apiItem.ملاحظات || apiItem.notes || '',
  };
}

export async function getInstapayItems(): Promise<InstapayItem[]> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const response = await instapayApi.getAll();
      if (response.success && response.data) {
        await updateLastSync();
        return response.data.map(convertApiInstapayToLocal);
      }
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  return await getOfflineInstapay();
}

export async function createInstapayItem(item: Omit<InstapayItem, 'id'>): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      await instapayApi.create({
        الاسم: item.name || '',
        التاريخ: item.date || new Date().toISOString().split('T')[0],
        معاه: item.advance || 0,
        منه: item.payment || 0,
        ملاحظات: item.notes || '',
      });
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await createOfflineInstapay(item);
}

export async function updateInstapayItem(id: string, item: Omit<InstapayItem, 'id'>): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) throw new Error('Invalid ID');
      
      await instapayApi.update(numId, {
        الاسم: item.name || '',
        التاريخ: item.date || new Date().toISOString().split('T')[0],
        معاه: item.advance || 0,
        منه: item.payment || 0,
        ملاحظات: item.notes || '',
      });
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await updateOfflineInstapay(id, item);
}

export async function deleteInstapayItem(id: string): Promise<void> {
  const mode = await getStorageMode();
  
  if (mode === 'api' && await isApiAvailable()) {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) throw new Error('Invalid ID');
      await instapayApi.delete(numId);
      await updateLastSync();
      return;
    } catch (error) {
      console.error('API error, falling back to offline:', error);
    }
  }
  
  // Fallback to offline
  await deleteOfflineInstapay(id);
}
