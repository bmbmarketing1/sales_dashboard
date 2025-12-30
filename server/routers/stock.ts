import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as XLSX from "xlsx";
import {
  getAllProducts,
  getAllChannels,
  upsertProductStock,
  upsertMarketplaceStock,
  getAllProductsWithStock,
} from "../db";

export const stockRouter = router({
  // Upload stock file
  uploadStock: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileBase64: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Decode base64 and parse XLS
      const buffer = Buffer.from(input.fileBase64, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
      
      // Get products and channels
      const products = await getAllProducts();
      const channels = await getAllChannels();
      
      // Find column indices from header row
      const headerRow = data[0] as string[];
      const columnIndices: Record<string, number> = {};
      
      headerRow.forEach((col, idx) => {
        const colLower = (col || "").toString().toLowerCase().trim();
        if (colLower.includes("cód") && colLower.includes("interno")) {
          columnIndices["internalCode"] = idx;
        } else if (colLower.includes("ml") && colLower.includes("ful")) {
          columnIndices["ml"] = idx;
        } else if (colLower.includes("magalu") && colLower.includes("ful")) {
          columnIndices["magalu"] = idx;
        } else if (colLower.includes("amazon") && colLower.includes("ful")) {
          columnIndices["amazon"] = idx;
        } else if (colLower.includes("shopee") && colLower.includes("full")) {
          columnIndices["shopee"] = idx;
        } else if (colLower.includes("tk") && colLower.includes("full")) {
          columnIndices["tiktok"] = idx;
        } else if (colLower.includes("mind") && colLower.includes("cnm")) {
          columnIndices["crossdocking"] = idx;
        }
      });
      
      let recordsImported = 0;
      const today = new Date();
      
      // Process each data row
      for (let i = 1; i < data.length; i++) {
        const row = data[i] as (string | number)[];
        if (!row || row.length === 0) continue;
        
        const internalCode = row[columnIndices["internalCode"]]?.toString().trim();
        if (!internalCode) continue;
        
        // Find product by internal code
        const product = products.find(p => p.internalCode === internalCode);
        if (!product) continue;
        
        // Get crossdocking stock
        const crossdockingStock = parseInt(row[columnIndices["crossdocking"]]?.toString() || "0") || 0;
        if (crossdockingStock >= 0) {
          await upsertProductStock(product.id, crossdockingStock, today);
        }
        
        // Get marketplace stocks
        const marketplaceStocks: Record<string, number> = {
          "Mercado Livre": parseInt(row[columnIndices["ml"]]?.toString() || "0") || 0,
          "Magalu": parseInt(row[columnIndices["magalu"]]?.toString() || "0") || 0,
          "Amazon": parseInt(row[columnIndices["amazon"]]?.toString() || "0") || 0,
          "Shopee": parseInt(row[columnIndices["shopee"]]?.toString() || "0") || 0,
          "TikTok": parseInt(row[columnIndices["tiktok"]]?.toString() || "0") || 0,
        };
        
        for (const [channelName, stock] of Object.entries(marketplaceStocks)) {
          const channel = channels.find(c => c.name === channelName);
          if (channel && stock >= 0) {
            await upsertMarketplaceStock(product.id, channel.id, stock, today);
          }
        }
        
        recordsImported++;
      }
      
      return {
        success: true,
        recordsImported,
      };
    }),
  
  // Get all products with stock info
  getProductsWithStock: publicProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      return getAllProductsWithStock(input.startDate, input.endDate);
    }),
});
