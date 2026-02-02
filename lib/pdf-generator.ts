import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

type KhazinaItem = {
  id: string;
  year: number;
  date: string;
  income: number;
  expense: number;
  total: number;
  balance: number;
  notes: string;
};

type SulfItem = {
  id: string;
  name: string;
  advance: number;
  payment: number;
  date: string;
  notes: string;
};

type QardItem = {
  id: string;
  name: string;
  amount: number;
  payment: number;
  date: string;
  notes: string;
};

const formatNumber = (num: number) => {
  return num.toLocaleString("ar-EG");
};

const formatDate = (dateVal: Date | string) => {
  const date = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return date.toLocaleDateString("ar-EG");
};

const getArabicCSS = () => `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', 'Arial', sans-serif;
      direction: rtl;
      padding: 40px;
      background: #ffffff;
      color: #11181C;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #0a7ea4;
      padding-bottom: 20px;
    }
    
    .header h1 {
      font-size: 32px;
      color: #0a7ea4;
      margin-bottom: 10px;
      font-weight: 700;
    }
    
    .header h2 {
      font-size: 24px;
      color: #687076;
      font-weight: 600;
    }
    
    .meta {
      margin-bottom: 30px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    
    .meta p {
      font-size: 14px;
      color: #687076;
      margin: 5px 0;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .summary-card {
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    
    .summary-card.income {
      background: #dcfce7;
      border: 2px solid #22C55E;
    }
    
    .summary-card.expense {
      background: #fee2e2;
      border: 2px solid #EF4444;
    }
    
    .summary-card.balance {
      background: #dbeafe;
      border: 2px solid #0a7ea4;
    }
    
    .summary-card.warning {
      background: #fef3c7;
      border: 2px solid #F59E0B;
    }
    
    .summary-card h3 {
      font-size: 14px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .summary-card p {
      font-size: 20px;
      font-weight: 700;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: white;
    }
    
    th {
      background: #0a7ea4;
      color: white;
      padding: 12px;
      text-align: center;
      font-weight: 600;
      font-size: 14px;
    }
    
    td {
      padding: 10px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    tr:nth-child(even) {
      background: #f9fafb;
    }
    
    tr:hover {
      background: #f3f4f6;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #687076;
      font-size: 12px;
    }
    
    .notes {
      font-size: 11px;
      color: #9BA1A6;
      font-style: italic;
    }
  </style>
`;

export const generateKhazinaPDF = async (data: KhazinaItem[], year: number) => {
  try {
    const totals = data.reduce(
      (acc, item) => ({
        income: acc.income + item.income,
        expense: acc.expense + item.expense,
        balance: acc.balance + item.balance,
      }),
      { income: 0, expense: 0, balance: 0 }
    );

    const tableRows = data
      .map(
        (item) => `
      <tr>
        <td>${formatDate(item.date)}</td>
        <td>${formatNumber(item.income)}</td>
        <td>${formatNumber(item.expense)}</td>
        <td>${formatNumber(item.total)}</td>
        <td>${formatNumber(item.balance)}</td>
        <td class="notes">${item.notes || "-"}</td>
      </tr>
    `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير الخزينة ${year}</title>
        ${getArabicCSS()}
      </head>
      <body>
        <div class="header">
          <h1>SELRS</h1>
          <h2>تقرير الخزينة</h2>
        </div>
        
        <div class="meta">
          <p><strong>السنة:</strong> ${year}</p>
          <p><strong>تاريخ التقرير:</strong> ${formatDate(new Date())}</p>
          <p><strong>عدد المعاملات:</strong> ${data.length}</p>
        </div>
        
        <div class="summary">
          <div class="summary-card income">
            <h3>إجمالي الإيرادات</h3>
            <p>${formatNumber(totals.income)} ج.م</p>
          </div>
          <div class="summary-card expense">
            <h3>إجمالي المصروفات</h3>
            <p>${formatNumber(totals.expense)} ج.م</p>
          </div>
          <div class="summary-card balance">
            <h3>الرصيد النهائي</h3>
            <p>${formatNumber(totals.balance)} ج.م</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الإيراد</th>
              <th>المصروف</th>
              <th>الإجمالي</th>
              <th>الرصيد</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة تطبيق SELRS</p>
          <p>${formatDate(new Date())} - ${new Date().toLocaleTimeString("ar-EG")}</p>
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === "web") {
      // On web, open in new tab
      window.open(uri, "_blank");
    } else {
      // On mobile, share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `تقرير الخزينة ${year}`,
        UTI: "com.adobe.pdf",
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    Alert.alert("خطأ", "فشل في إنشاء ملف PDF");
    return false;
  }
};

export const generateSulfPDF = async (data: SulfItem[]) => {
  try {
    const totals = data.reduce(
      (acc, item) => ({
        totalLoan: acc.totalLoan + item.advance,
        totalPaid: acc.totalPaid + item.payment,
        remaining: acc.remaining + (item.advance - item.payment),
      }),
      { totalLoan: 0, totalPaid: 0, remaining: 0 }
    );

    const tableRows = data
      .map(
        (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${formatDate(item.date)}</td>
        <td>${formatNumber(item.advance)}</td>
        <td>${formatNumber(item.payment)}</td>
        <td>${formatNumber(item.advance - item.payment)}</td>
        <td class="notes">${item.notes || "-"}</td>
      </tr>
    `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير السلف</title>
        ${getArabicCSS()}
      </head>
      <body>
        <div class="header">
          <h1>SELRS</h1>
          <h2>تقرير السلف</h2>
        </div>
        
        <div class="meta">
          <p><strong>تاريخ التقرير:</strong> ${formatDate(new Date())}</p>
          <p><strong>عدد السجلات:</strong> ${data.length}</p>
        </div>
        
        <div class="summary">
          <div class="summary-card warning">
            <h3>إجمالي السلف</h3>
            <p>${formatNumber(totals.totalLoan)} ج.م</p>
          </div>
          <div class="summary-card income">
            <h3>إجمالي المسدد</h3>
            <p>${formatNumber(totals.totalPaid)} ج.م</p>
          </div>
          <div class="summary-card expense">
            <h3>المتبقي</h3>
            <p>${formatNumber(totals.remaining)} ج.م</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>التاريخ</th>
              <th>السلفة</th>
              <th>المسدد</th>
              <th>المتبقي</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة تطبيق SELRS</p>
          <p>${formatDate(new Date())} - ${new Date().toLocaleTimeString("ar-EG")}</p>
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === "web") {
      window.open(uri, "_blank");
    } else {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "تقرير السلف",
        UTI: "com.adobe.pdf",
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    Alert.alert("خطأ", "فشل في إنشاء ملف PDF");
    return false;
  }
};

export const generateQardPDF = async (data: QardItem[]) => {
  try {
    const totalAmount = data.reduce((acc, item) => acc + item.amount, 0);

    const tableRows = data
      .map(
        (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${formatDate(item.date)}</td>
        <td>${formatNumber(item.amount)}</td>
        <td class="notes">${item.notes || "-"}</td>
      </tr>
    `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير القروض</title>
        ${getArabicCSS()}
      </head>
      <body>
        <div class="header">
          <h1>SELRS</h1>
          <h2>تقرير القروض</h2>
        </div>
        
        <div class="meta">
          <p><strong>تاريخ التقرير:</strong> ${formatDate(new Date())}</p>
          <p><strong>عدد القروض:</strong> ${data.length}</p>
        </div>
        
        <div class="summary">
          <div class="summary-card balance">
            <h3>إجمالي القروض</h3>
            <p>${formatNumber(totalAmount)} ج.م</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>التاريخ</th>
              <th>المبلغ</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة تطبيق SELRS</p>
          <p>${formatDate(new Date())} - ${new Date().toLocaleTimeString("ar-EG")}</p>
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === "web") {
      window.open(uri, "_blank");
    } else {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "تقرير القروض",
        UTI: "com.adobe.pdf",
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    Alert.alert("خطأ", "فشل في إنشاء ملف PDF");
    return false;
  }
};
