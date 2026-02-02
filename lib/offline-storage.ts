import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const KHAZINA_KEY = "khazina_data";
const SULF_KEY = "sulf_data";
const QARD_KEY = "qard_data";

export type KhazinaItem = {
  id: string;
  year: number;
  date: string;
  income: number;
  expense: number;
  total: number;
  balance: number;
  notes: string;
};

export type SulfItem = {
  id: string;
  name: string;
  advance: number;  // سلفه
  payment: number;  // سداد
  date: string;
  notes: string;
};

export type QardItem = {
  id: string;
  name: string;
  amount: number;   // المبلغ
  payment: number;  // سداد
  date: string;
  notes: string;
};

// Helper to generate unique IDs
const generateId = () => (Date.now() + Math.floor(Math.random() * 1000)).toString();

// ============= KHAZINA OPERATIONS =============

export async function getKhazinaItems(year: number): Promise<KhazinaItem[]> {
  try {
    const data = await AsyncStorage.getItem(KHAZINA_KEY);
    if (!data) return [];
    const allItems: KhazinaItem[] = JSON.parse(data);
    return allItems.filter((item) => item.year === year);
  } catch (error) {
    console.error("Failed to get Khazina items:", error);
    return [];
  }
}

export async function createKhazinaItem(item: Omit<KhazinaItem, "id">): Promise<KhazinaItem> {
  try {
    const data = await AsyncStorage.getItem(KHAZINA_KEY);
    const items: KhazinaItem[] = data ? JSON.parse(data) : [];
    const newItem: KhazinaItem = { ...item, id: generateId() };
    items.push(newItem);
    await AsyncStorage.setItem(KHAZINA_KEY, JSON.stringify(items));
    return newItem;
  } catch (error) {
    console.error("Failed to create Khazina item:", error);
    throw error;
  }
}

export async function updateKhazinaItem(id: string, updates: Partial<KhazinaItem>): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KHAZINA_KEY);
    if (!data) throw new Error("No data found");
    const items: KhazinaItem[] = JSON.parse(data);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Item not found");
    items[index] = { ...items[index], ...updates };
    await AsyncStorage.setItem(KHAZINA_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to update Khazina item:", error);
    throw error;
  }
}

export async function deleteKhazinaItem(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KHAZINA_KEY);
    if (!data) throw new Error("No data found");
    const items: KhazinaItem[] = JSON.parse(data);
    const filtered = items.filter((item) => item.id !== id);
    await AsyncStorage.setItem(KHAZINA_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete Khazina item:", error);
    throw error;
  }
}

export async function clearKhazinaItems(year: number): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KHAZINA_KEY);
    if (!data) return;
    const items: KhazinaItem[] = JSON.parse(data);
    // Keep items from other years, remove only items from specified year
    const filtered = items.filter((item) => item.year !== year);
    await AsyncStorage.setItem(KHAZINA_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to clear Khazina items:", error);
    throw error;
  }
}

// ============= SULF OPERATIONS =============

export async function getSulfItems(): Promise<SulfItem[]> {
  try {
    const data = await AsyncStorage.getItem(SULF_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to get Sulf items:", error);
    return [];
  }
}

export async function createSulfItem(item: Omit<SulfItem, "id">): Promise<SulfItem> {
  try {
    const data = await AsyncStorage.getItem(SULF_KEY);
    const items: SulfItem[] = data ? JSON.parse(data) : [];
    const newItem: SulfItem = { ...item, id: generateId() };
    items.push(newItem);
    await AsyncStorage.setItem(SULF_KEY, JSON.stringify(items));
    return newItem;
  } catch (error) {
    console.error("Failed to create Sulf item:", error);
    throw error;
  }
}

export async function updateSulfItem(id: string, updates: Partial<SulfItem>): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(SULF_KEY);
    if (!data) throw new Error("No data found");
    const items: SulfItem[] = JSON.parse(data);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Item not found");
    items[index] = { ...items[index], ...updates };
    await AsyncStorage.setItem(SULF_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to update Sulf item:", error);
    throw error;
  }
}

export async function deleteSulfItem(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(SULF_KEY);
    if (!data) throw new Error("No data found");
    const items: SulfItem[] = JSON.parse(data);
    const filtered = items.filter((item) => item.id !== id);
    await AsyncStorage.setItem(SULF_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete Sulf item:", error);
    throw error;
  }
}

export async function clearSulfItems(): Promise<void> {
  try {
    await AsyncStorage.setItem(SULF_KEY, JSON.stringify([]));
  } catch (error) {
    console.error("Failed to clear Sulf items:", error);
    throw error;
  }
}

// ============= QARD OPERATIONS =============

export async function getQardItems(): Promise<QardItem[]> {
  try {
    const data = await AsyncStorage.getItem(QARD_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to get Qard items:", error);
    return [];
  }
}

export async function createQardItem(item: Omit<QardItem, "id">): Promise<QardItem> {
  try {
    const data = await AsyncStorage.getItem(QARD_KEY);
    const items: QardItem[] = data ? JSON.parse(data) : [];
    const newItem: QardItem = { ...item, id: generateId() };
    items.push(newItem);
    await AsyncStorage.setItem(QARD_KEY, JSON.stringify(items));
    return newItem;
  } catch (error) {
    console.error("Failed to create Qard item:", error);
    throw error;
  }
}

export async function updateQardItem(id: string, updates: Partial<QardItem>): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(QARD_KEY);
    if (!data) throw new Error("No data found");
    const items: QardItem[] = JSON.parse(data);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Item not found");
    items[index] = { ...items[index], ...updates };
    await AsyncStorage.setItem(QARD_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to update Qard item:", error);
    throw error;
  }
}

export async function deleteQardItem(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(QARD_KEY);
    if (!data) throw new Error("No data found");
    const items: QardItem[] = JSON.parse(data);
    const filtered = items.filter((item) => item.id !== id);
    await AsyncStorage.setItem(QARD_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete Qard item:", error);
    throw error;
  }
}

export async function clearQardItems(): Promise<void> {
  try {
    await AsyncStorage.setItem(QARD_KEY, JSON.stringify([]));
  } catch (error) {
    console.error("Failed to clear Qard items:", error);
    throw error;
  }
}

// ============= BAIT OPERATIONS =============

export type BaitItem = {
  id: string;
  name: string;
  advance: number;  // معاه
  payment: number;  // منه
  date: string;
  notes: string;
};

const BAIT_KEY = "bait_data";

export async function getBaitItems(): Promise<BaitItem[]> {
  try {
    const data = await AsyncStorage.getItem(BAIT_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to get Bait items:", error);
    return [];
  }
}

export async function createBaitItem(item: Omit<BaitItem, "id">): Promise<BaitItem> {
  try {
    const data = await AsyncStorage.getItem(BAIT_KEY);
    const items: BaitItem[] = data ? JSON.parse(data) : [];
    const newItem: BaitItem = { ...item, id: generateId() };
    items.push(newItem);
    await AsyncStorage.setItem(BAIT_KEY, JSON.stringify(items));
    return newItem;
  } catch (error) {
    console.error("Failed to create Bait item:", error);
    throw error;
  }
}

export async function updateBaitItem(id: string, updates: Partial<BaitItem>): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(BAIT_KEY);
    if (!data) throw new Error("No data found");
    const items: BaitItem[] = JSON.parse(data);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Item not found");
    items[index] = { ...items[index], ...updates };
    await AsyncStorage.setItem(BAIT_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to update Bait item:", error);
    throw error;
  }
}

export async function deleteBaitItem(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(BAIT_KEY);
    if (!data) throw new Error("No data found");
    const items: BaitItem[] = JSON.parse(data);
    const filtered = items.filter((item) => item.id !== id);
    await AsyncStorage.setItem(BAIT_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete Bait item:", error);
    throw error;
  }
}

export async function clearBaitItems(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BAIT_KEY);
  } catch (error) {
    console.error("Failed to clear Bait items:", error);
    throw error;
  }
}

// ============= INSTAPAY OPERATIONS =============

export type InstapayItem = {
  id: string;
  name: string;
  advance: number;  // معاه
  payment: number;  // منه
  date: string;
  notes: string;
};

const INSTAPAY_KEY = "instapay_data";

export async function getInstapayItems(): Promise<InstapayItem[]> {
  try {
    const data = await AsyncStorage.getItem(INSTAPAY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to get InstaPay items:", error);
    return [];
  }
}

export async function createInstapayItem(item: Omit<InstapayItem, "id">): Promise<InstapayItem> {
  try {
    const data = await AsyncStorage.getItem(INSTAPAY_KEY);
    const items: InstapayItem[] = data ? JSON.parse(data) : [];
    const newItem: InstapayItem = { ...item, id: generateId() };
    items.push(newItem);
    await AsyncStorage.setItem(INSTAPAY_KEY, JSON.stringify(items));
    return newItem;
  } catch (error) {
    console.error("Failed to create InstaPay item:", error);
    throw error;
  }
}

export async function updateInstapayItem(id: string, updates: Partial<InstapayItem>): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(INSTAPAY_KEY);
    if (!data) throw new Error("No data found");
    const items: InstapayItem[] = JSON.parse(data);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Item not found");
    items[index] = { ...items[index], ...updates };
    await AsyncStorage.setItem(INSTAPAY_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to update InstaPay item:", error);
    throw error;
  }
}

export async function deleteInstapayItem(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(INSTAPAY_KEY);
    if (!data) throw new Error("No data found");
    const items: InstapayItem[] = JSON.parse(data);
    const filtered = items.filter((item) => item.id !== id);
    await AsyncStorage.setItem(INSTAPAY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete InstaPay item:", error);
    throw error;
  }
}

export async function clearInstapayItems(): Promise<void> {
  try {
    await AsyncStorage.removeItem(INSTAPAY_KEY);
  } catch (error) {
    console.error("Failed to clear InstaPay items:", error);
    throw error;
  }
}
