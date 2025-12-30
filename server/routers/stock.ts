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
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`[Stock Upload] Iniciando upload: ${input.fileName}`);
        console.log(`[Stock Upload] User: ${ctx.user?.id}`);
        
        // Decode base64
        const buffer = Buffer.from(input.fileBase64, "base64");
        console.log(`[Stock Upload] Buffer size: ${buffer.length} bytes`);
        
        // XLSX.read suporta tanto .xlsx quanto .xls antigos
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
        
        console.log("Headers encontrados:", headerRow);
        
        // Mapeamento de colunas - buscar por padrões na sua planilha
        headerRow.forEach((col, idx) => {
          const colLower = (col || "").toString().toLowerCase().trim();
          
          if (colLower.includes("cód") && colLower.includes("interno")) {
            columnIndices["internalCode"] = idx;
          }
          // Mercado Livre - procurar por "ml" + "ful" + "cnm"
          else if (colLower.includes("ml") && colLower.includes("ful") && colLower.includes("cnm")) {
            columnIndices["ml"] = idx;
          }
          // Magalu - procurar por "magalu" + "ful" + "cnm"
          else if (colLower.includes("magalu") && colLower.includes("ful") && colLower.includes("cnm")) {
            columnIndices["magalu"] = idx;
          }
          // Amazon - procurar por "amazon" + "ful" + "cnm"
          else if (colLower.includes("amazon") && colLower.includes("ful") && colLower.includes("cnm")) {
            columnIndices["amazon"] = idx;
          }
          // Shopee - procurar por "shopee" + "full" + "cnm"
          else if (colLower.includes("shopee") && colLower.includes("full") && colLower.includes("cnm")) {
            columnIndices["shopee"] = idx;
          }
          // TikTok - procurar por "tk" + "full" + "cnm"
          else if ((colLower.includes("tk") || colLower.includes("tiktok")) && colLower.includes("full") && colLower.includes("cnm")) {
            columnIndices["tiktok"] = idx;
          }
          // Crossdocking - procurar por "mind" + "cnm"
          else if (colLower.includes("mind") && colLower.includes("cnm")) {
            columnIndices["crossdocking"] = idx;
          }
        });
        
        console.log(`[Stock Upload] Column indices encontrados:`, columnIndices);
        
        let recordsImported = 0;
        const today = new Date();
        
        console.log(`[Stock Upload] Iniciando processamento de ${data.length - 1} linhas...`);
        
        // Process each data row
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as (string | number)[];
          if (!row || row.length === 0) continue;
          
          const internalCode = row[columnIndices["internalCode"]]?.toString().trim();
          if (!internalCode) continue;
          
          // Ignorar produtos que não começam com BL
          if (!internalCode.startsWith("BL")) continue;
          
          // Find product by internal code
          const product = products.find(p => p.internalCode === internalCode);
          if (!product) continue;
          
          // Get crossdocking stock (ignorar valores negativos)
          const crossdockingValue = row[columnIndices["crossdocking"]]?.toString() || "0";
          const crossdockingStock = Math.max(0, parseInt(crossdockingValue) || 0);
          if (crossdockingStock > 0) {
            await upsertProductStock(product.id, crossdockingStock, today);
          }
          
          // Get marketplace stocks (ignorar valores negativos)
          const marketplaceStocks: Record<string, number> = {
            "Mercado Livre": Math.max(0, parseInt(row[columnIndices["ml"]]?.toString() || "0") || 0),
            "Magalu": Math.max(0, parseInt(row[columnIndices["magalu"]]?.toString() || "0") || 0),
            "Amazon": Math.max(0, parseInt(row[columnIndices["amazon"]]?.toString() || "0") || 0),
            "Shopee": Math.max(0, parseInt(row[columnIndices["shopee"]]?.toString() || "0") || 0),
            "TikTok": Math.max(0, parseInt(row[columnIndices["tiktok"]]?.toString() || "0") || 0),
          };
          
          for (const [channelName, stock] of Object.entries(marketplaceStocks)) {
            const channel = channels.find(c => c.name === channelName);
            if (channel && stock > 0) {
              await upsertMarketplaceStock(product.id, channel.id, stock, today);
            }
          }
          
          recordsImported++;
        }
        
        console.log(`[Stock Upload] Importação concluída! ${recordsImported} produtos atualizados`);
        
        return {
          success: true,
          recordsImported,
          message: `✅ Importação concluída: ${recordsImported} produtos atualizados com estoque`,
        };
      } catch (error) {
        console.error("Erro ao importar estoque:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        throw new Error(`❌ Erro ao importar estoque: ${errorMessage}`);
      }
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
  
  testUpload: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        console.log(`[Stock Test] Iniciando teste`);
        const products = await getAllProducts();
        const channels = await getAllChannels();
        let recordsImported = 0;
        const today = new Date();
        const testCodes = ["BL001", "BL003", "BL005"];
        for (const code of testCodes) {
          const product = products.find(p => p.internalCode === code);
          if (product) {
            await upsertProductStock(product.id, 100, today);
            recordsImported++;
          }
        }
        return { success: true, recordsImported, message: `Teste ok: ${recordsImported} produtos` };
      } catch (error) {
        throw new Error(`Erro: ${error}`);
      }
    }),
});
