import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export type KhazinaRow = {
  date: string;
  income: number;
  expense: number;
  total: number;
  balance: number;
  notes: string;
};

export type SulfRow = {
  name: string;
  date: string;
  advance: number;
  payment: number;
  notes: string;
};

export type QardRow = {
  name: string;
  date: string;
  amount: number;
  notes: string;
};

export type BaitRow = {
  name: string;
  date: string;
  advance: number;
  payment: number;
  notes: string;
};

export type InstapayRow = {
  name: string;
  date: string;
  advance: number;
  payment: number;
  notes: string;
};

/**
 * Read Excel file and parse Khazina data from "All" sheet
 */
export async function parseKhazinaExcel(fileUri: string): Promise<KhazinaRow[]> {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: "base64" as any,
    });

    // Parse workbook
    const workbook = XLSX.read(base64, { type: "base64" });
    
    // Get "All" sheet
    const sheetName = workbook.SheetNames.find(name => name === "All") || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    
    const results: KhazinaRow[] = [];
    
    for (const row of data as any[]) {
      // Skip header rows or empty rows
      if (!row["التاريخ"]) continue;
      
      const dateStr = row["التاريخ"];
      const income = parseFloat(row["الايراد"]) || 0;
      const expense = parseFloat(row["المصروف"]) || 0;
      const total = parseFloat(row["الإجمالي"]) || 0;
      const balance = parseFloat(row["الرصيد"]) || 0;
      const notes = row["ملاحظات"] || "";
      
      // Parse date
      let date: Date;
      if (typeof dateStr === "string") {
        // Check if it's already a formatted date
        if (dateStr.includes("-") || dateStr.includes("/")) {
          date = new Date(dateStr);
        } else {
          // Might be a serial number as string
          const serial = parseFloat(dateStr);
          if (!isNaN(serial)) {
            // Excel epoch starts at 1900-01-01
            date = new Date((serial - 25569) * 86400 * 1000);
          } else {
            date = new Date(dateStr);
          }
        }
      } else if (typeof dateStr === "number") {
        // Excel serial date: convert to JS date
        // Excel epoch: 1900-01-01, JS epoch: 1970-01-01
        // Difference: 25569 days
        date = new Date((dateStr - 25569) * 86400 * 1000);
      } else {
        continue;
      }
      
      if (isNaN(date.getTime())) continue;
      
      results.push({
        date: date.toISOString().split("T")[0],
        income,
        expense,
        total,
        balance,
        notes,
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error parsing Khazina Excel:", error);
    throw new Error("فشل في قراءة ملف الخزينة");
  }
}

/**
 * Read Excel file and parse Sulf data from "سلف" sheet
 */
export async function parseSulfExcel(fileUri: string): Promise<SulfRow[]> {
  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: "base64" as any,
    });

    const workbook = XLSX.read(base64, { type: "base64" });
    
    const sheetName = workbook.SheetNames.find(name => name === "سلف") || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    
    const results: SulfRow[] = [];
    
    for (const row of data as any[]) {
      if (!row["التاريخ"]) continue;
      
      // Try both column names (الموظف or الاسم)
      const name = row["الاسم"] || row["الموظف"] || "";
      if (!name) continue;
      const dateStr = row["التاريخ"];
      const advance = Math.abs(parseFloat(row["سلفه"]) || 0);
      const payment = Math.abs(parseFloat(row["سداد"]) || 0);
      const notes = row["ملاحظات"] || "";
      
      // Parse date
      let date: Date;
      if (typeof dateStr === "string") {
        if (dateStr.includes("-") || dateStr.includes("/")) {
          date = new Date(dateStr);
        } else {
          const serial = parseFloat(dateStr);
          if (!isNaN(serial)) {
            date = new Date((serial - 25569) * 86400 * 1000);
          } else {
            date = new Date(dateStr);
          }
        }
      } else if (typeof dateStr === "number") {
        date = new Date((dateStr - 25569) * 86400 * 1000);
      } else {
        continue;
      }
      
      if (isNaN(date.getTime())) continue;
      
      results.push({
        name,
        date: date.toISOString().split("T")[0],
        advance,
        payment,
        notes,
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error parsing Sulf Excel:", error);
    throw new Error("فشل في قراءة ملف السلف");
  }
}

/**
 * Read Excel file and parse Qard data from "القرض" sheet
 */
export async function parseQardExcel(fileUri: string): Promise<QardRow[]> {
  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: "base64" as any,
    });

    const workbook = XLSX.read(base64, { type: "base64" });
    
    const sheetName = workbook.SheetNames.find(name => name === "القرض") || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    
    const results: QardRow[] = [];
    
    for (const row of data as any[]) {
      if (!row["التاريخ"] || !row["الاسم"]) continue;
      
      const name = row["الاسم"];
      const dateStr = row["التاريخ"];
      const amount = parseFloat(row["المبلغ"]) || 0;
      const notes = row["ملاحظات"] || "";
      
      // Parse date
      let date: Date;
      if (typeof dateStr === "string") {
        if (dateStr.includes("-") || dateStr.includes("/")) {
          date = new Date(dateStr);
        } else {
          const serial = parseFloat(dateStr);
          if (!isNaN(serial)) {
            date = new Date((serial - 25569) * 86400 * 1000);
          } else {
            date = new Date(dateStr);
          }
        }
      } else if (typeof dateStr === "number") {
        date = new Date((dateStr - 25569) * 86400 * 1000);
      } else {
        continue;
      }
      
      if (isNaN(date.getTime())) continue;
      
      results.push({
        name,
        date: date.toISOString().split("T")[0],
        amount,
        notes,
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error parsing Qard Excel:", error);
    throw new Error("فشل في قراءة ملف القرض");
  }
}

/**
 * Read Excel file and parse Bait data from "البيت" sheet
 */
export async function parseBaitExcel(fileUri: string): Promise<BaitRow[]> {
  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: "base64" as any,
    });

    const workbook = XLSX.read(base64, { type: "base64" });
    
    const sheetName = workbook.SheetNames.find(name => name === "البيت") || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    
    const results: BaitRow[] = [];
    
    for (const row of data as any[]) {
      if (!row["التاريخ"] || !row["الاسم"]) continue;
      
      const name = row["الاسم"];
      const dateStr = row["التاريخ"];
      const advance = Math.abs(parseFloat(row["معاه"]) || 0);
      const payment = Math.abs(parseFloat(row["منه"]) || 0);
      const notes = row["ملاحظات"] || "";
      
      // Parse date
      let date: Date;
      if (typeof dateStr === "string") {
        if (dateStr.includes("-") || dateStr.includes("/")) {
          date = new Date(dateStr);
        } else {
          const serial = parseFloat(dateStr);
          if (!isNaN(serial)) {
            date = new Date((serial - 25569) * 86400 * 1000);
          } else {
            date = new Date(dateStr);
          }
        }
      } else if (typeof dateStr === "number") {
        date = new Date((dateStr - 25569) * 86400 * 1000);
      } else {
        continue;
      }
      
      if (isNaN(date.getTime())) continue;
      
      results.push({
        name,
        date: date.toISOString().split("T")[0],
        advance,
        payment,
        notes,
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error parsing Bait Excel:", error);
    throw new Error("فشل في قراءة ملف البيت");
  }
}

/**
 * Read Excel file and parse InstaPay data from "انستا" sheet
 */
export async function parseInstapayExcel(fileUri: string): Promise<InstapayRow[]> {
  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: "base64" as any,
    });

    const workbook = XLSX.read(base64, { type: "base64" });
    
    const sheetName = workbook.SheetNames.find(name => name === "انستا") || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    
    const results: InstapayRow[] = [];
    
    for (const row of data as any[]) {
      if (!row["التاريخ"] || !row["الاسم"]) continue;
      
      const name = row["الاسم"];
      const dateStr = row["التاريخ"];
      const advance = Math.abs(parseFloat(row["معاه"]) || 0);
      const payment = Math.abs(parseFloat(row["منه"]) || 0);
      const notes = row["ملاحظات"] || "";
      
      // Parse date
      let date: Date;
      if (typeof dateStr === "string") {
        if (dateStr.includes("-") || dateStr.includes("/")) {
          date = new Date(dateStr);
        } else {
          const serial = parseFloat(dateStr);
          if (!isNaN(serial)) {
            date = new Date((serial - 25569) * 86400 * 1000);
          } else {
            date = new Date(dateStr);
          }
        }
      } else if (typeof dateStr === "number") {
        date = new Date((dateStr - 25569) * 86400 * 1000);
      } else {
        continue;
      }
      
      if (isNaN(date.getTime())) continue;
      
      results.push({
        name,
        date: date.toISOString().split("T")[0],
        advance,
        payment,
        notes,
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error parsing InstaPay Excel:", error);
    throw new Error("فشل في قراءة ملف الانستا");
  }
}
