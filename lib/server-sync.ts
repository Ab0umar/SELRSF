import axios, { type AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SERVER_URL = "https://selrs.cc:3000";
const SERVER_USERNAME = "admin";
const SERVER_PASSWORD = "selrs2024";

interface SyncConfig {
  enabled: boolean;
  lastSyncTime: number;
  syncInterval: number; // in milliseconds
}

class ServerSyncService {
  private client: AxiosInstance;
  private syncConfig: SyncConfig = {
    enabled: true,
    lastSyncTime: 0,
    syncInterval: 5 * 60 * 1000, // 5 minutes
  };
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;

  constructor() {
    this.client = axios.create({
      baseURL: SERVER_URL,
      timeout: 10000,
      withCredentials: true,
    });

    // Add auth interceptor
    this.client.interceptors.request.use(
      (config) => {
        const auth = Buffer.from(`${SERVER_USERNAME}:${SERVER_PASSWORD}`).toString("base64");
        config.headers.Authorization = `Basic ${auth}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Initialize sync service and start automatic syncing
   */
  async initialize() {
    try {
      // Load sync config from storage
      const savedConfig = await AsyncStorage.getItem("syncConfig");
      if (savedConfig) {
        this.syncConfig = JSON.parse(savedConfig);
      }

      // Start automatic sync
      this.startAutoSync();
      console.log("✅ Server sync service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize sync service:", error);
    }
  }

  /**
   * Start automatic synchronization
   */
  private startAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      if (this.syncConfig.enabled && !this.isSyncing) {
        await this.syncAll();
      }
    }, this.syncConfig.syncInterval);

    // Also sync immediately on startup
    this.syncAll();
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Sync all data with server
   */
  async syncAll() {
    if (this.isSyncing) return;

    this.isSyncing = true;
    try {
      console.log("🔄 Starting sync with server...");

      // Sync each module
      await Promise.all([
        this.syncKhazina(),
        this.syncSulf(),
        this.syncQard(),
        this.syncBait(),
        this.syncInstapay(),
      ]);

      this.syncConfig.lastSyncTime = Date.now();
      await AsyncStorage.setItem("syncConfig", JSON.stringify(this.syncConfig));

      console.log("✅ Sync completed successfully");
    } catch (error) {
      console.error("❌ Sync failed:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync Khazina data
   */
  private async syncKhazina() {
    try {
      const response = await this.client.get("/api/khazina");
      const serverData = response.data;
      await AsyncStorage.setItem("khazina_items", JSON.stringify(serverData));
      console.log("✅ Khazina synced");
    } catch (error) {
      console.error("❌ Khazina sync failed:", error);
    }
  }

  /**
   * Sync Sulf data
   */
  private async syncSulf() {
    try {
      const response = await this.client.get("/api/sulf");
      const serverData = response.data;
      await AsyncStorage.setItem("sulf_items", JSON.stringify(serverData));
      console.log("✅ Sulf synced");
    } catch (error) {
      console.error("❌ Sulf sync failed:", error);
    }
  }

  /**
   * Sync Qard data
   */
  private async syncQard() {
    try {
      const response = await this.client.get("/api/qard");
      const serverData = response.data;
      await AsyncStorage.setItem("qard_items", JSON.stringify(serverData));
      console.log("✅ Qard synced");
    } catch (error) {
      console.error("❌ Qard sync failed:", error);
    }
  }

  /**
   * Sync Bait data
   */
  private async syncBait() {
    try {
      const response = await this.client.get("/api/bait");
      const serverData = response.data;
      await AsyncStorage.setItem("bait_items", JSON.stringify(serverData));
      console.log("✅ Bait synced");
    } catch (error) {
      console.error("❌ Bait sync failed:", error);
    }
  }

  /**
   * Sync InstaPay data
   */
  private async syncInstapay() {
    try {
      const response = await this.client.get("/api/instapay");
      const serverData = response.data;
      await AsyncStorage.setItem("instapay_items", JSON.stringify(serverData));
      console.log("✅ InstaPay synced");
    } catch (error) {
      console.error("❌ InstaPay sync failed:", error);
    }
  }

  /**
   * Push local changes to server
   */
  async pushChanges(module: string, data: any) {
    try {
      const endpoint = `/api/${module}`;
      await this.client.post(endpoint, data);
      console.log(`✅ ${module} changes pushed to server`);
    } catch (error) {
      console.error(`❌ Failed to push ${module} changes:`, error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      enabled: this.syncConfig.enabled,
      lastSyncTime: this.syncConfig.lastSyncTime,
      isSyncing: this.isSyncing,
      nextSyncTime: this.syncConfig.lastSyncTime + this.syncConfig.syncInterval,
    };
  }

  /**
   * Enable/disable sync
   */
  setSyncEnabled(enabled: boolean) {
    this.syncConfig.enabled = enabled;
    if (enabled) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  /**
   * Set sync interval
   */
  setSyncInterval(interval: number) {
    this.syncConfig.syncInterval = interval;
    this.startAutoSync();
  }
}

// Export singleton instance
export const serverSync = new ServerSyncService();
