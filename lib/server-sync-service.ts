import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const SERVER_URL = "https://selrs.cc:3000";
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CREDENTIALS = {
  username: "admin",
  password: "selrs2024",
};

interface SyncItem {
  id: string;
  type: "khazina" | "sulf" | "qard" | "bait" | "instapay";
  data: any;
  timestamp: number;
}

class ServerSyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private syncStatus = {
    lastSync: null as number | null,
    isOnline: true,
    itemsPending: 0,
  };

  async initialize() {
    console.log("[Sync] Initializing server sync service...");
    this.startAutoSync();
  }

  private startAutoSync() {
    // Sync immediately on startup
    this.syncData();

    // Then sync periodically
    this.syncInterval = setInterval(() => {
      this.syncData();
    }, SYNC_INTERVAL);
  }

  async syncData() {
    if (this.isSyncing) {
      console.log("[Sync] Sync already in progress, skipping...");
      return;
    }

    this.isSyncing = true;
    try {
      console.log("[Sync] Starting data synchronization...");

      // Get all pending items from local storage
      const pendingItems = await this.getPendingItems();
      console.log(`[Sync] Found ${pendingItems.length} pending items`);

      if (pendingItems.length === 0) {
        this.syncStatus.lastSync = Date.now();
        this.syncStatus.itemsPending = 0;
        return;
      }

      // Sync each item type
      const khazina = pendingItems.filter((item) => item.type === "khazina");
      const sulf = pendingItems.filter((item) => item.type === "sulf");
      const qard = pendingItems.filter((item) => item.type === "qard");
      const bait = pendingItems.filter((item) => item.type === "bait");
      const instapay = pendingItems.filter((item) => item.type === "instapay");

      if (khazina.length > 0) await this.syncKhazina(khazina);
      if (sulf.length > 0) await this.syncSulf(sulf);
      if (qard.length > 0) await this.syncQard(qard);
      if (bait.length > 0) await this.syncBait(bait);
      if (instapay.length > 0) await this.syncInstapay(instapay);

      // Clear synced items
      await this.clearSyncedItems();

      this.syncStatus.lastSync = Date.now();
      this.syncStatus.itemsPending = 0;
      this.syncStatus.isOnline = true;

      console.log("[Sync] Synchronization completed successfully");
    } catch (error) {
      console.error("[Sync] Synchronization failed:", error);
      this.syncStatus.isOnline = false;
      this.syncStatus.itemsPending = (await this.getPendingItems()).length;
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncKhazina(items: SyncItem[]) {
    try {
      for (const item of items) {
        await axios.post(`${SERVER_URL}/api/khazina`, item.data, {
          auth: CREDENTIALS,
          timeout: 10000,
        });
      }
      console.log(`[Sync] Synced ${items.length} khazina items`);
    } catch (error) {
      console.error("[Sync] Failed to sync khazina:", error);
      throw error;
    }
  }

  private async syncSulf(items: SyncItem[]) {
    try {
      for (const item of items) {
        await axios.post(`${SERVER_URL}/api/sulf`, item.data, {
          auth: CREDENTIALS,
          timeout: 10000,
        });
      }
      console.log(`[Sync] Synced ${items.length} sulf items`);
    } catch (error) {
      console.error("[Sync] Failed to sync sulf:", error);
      throw error;
    }
  }

  private async syncQard(items: SyncItem[]) {
    try {
      for (const item of items) {
        await axios.post(`${SERVER_URL}/api/qard`, item.data, {
          auth: CREDENTIALS,
          timeout: 10000,
        });
      }
      console.log(`[Sync] Synced ${items.length} qard items`);
    } catch (error) {
      console.error("[Sync] Failed to sync qard:", error);
      throw error;
    }
  }

  private async syncBait(items: SyncItem[]) {
    try {
      for (const item of items) {
        await axios.post(`${SERVER_URL}/api/bait`, item.data, {
          auth: CREDENTIALS,
          timeout: 10000,
        });
      }
      console.log(`[Sync] Synced ${items.length} bait items`);
    } catch (error) {
      console.error("[Sync] Failed to sync bait:", error);
      throw error;
    }
  }

  private async syncInstapay(items: SyncItem[]) {
    try {
      for (const item of items) {
        await axios.post(`${SERVER_URL}/api/instapay`, item.data, {
          auth: CREDENTIALS,
          timeout: 10000,
        });
      }
      console.log(`[Sync] Synced ${items.length} instapay items`);
    } catch (error) {
      console.error("[Sync] Failed to sync instapay:", error);
      throw error;
    }
  }

  private async getPendingItems(): Promise<SyncItem[]> {
    try {
      const data = await AsyncStorage.getItem("pending_sync_items");
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("[Sync] Failed to get pending items:", error);
      return [];
    }
  }

  async addPendingItem(type: SyncItem["type"], data: any) {
    try {
      const items = await this.getPendingItems();
      items.push({
        id: `${type}_${Date.now()}`,
        type,
        data,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem("pending_sync_items", JSON.stringify(items));
      this.syncStatus.itemsPending = items.length;
      console.log(`[Sync] Added pending item: ${type}`);

      // Trigger sync if not already syncing
      if (!this.isSyncing) {
        this.syncData();
      }
    } catch (error) {
      console.error("[Sync] Failed to add pending item:", error);
    }
  }

  private async clearSyncedItems() {
    try {
      await AsyncStorage.removeItem("pending_sync_items");
    } catch (error) {
      console.error("[Sync] Failed to clear synced items:", error);
    }
  }

  getSyncStatus() {
    return this.syncStatus;
  }

  async manualSync() {
    await this.syncData();
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const serverSyncService = new ServerSyncService();
