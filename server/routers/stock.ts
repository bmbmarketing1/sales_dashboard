import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as XLSX from "xlsx";
import {
  getAllProducts,
  getAllChannels,
  upsertProductChannelStockType,
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
        
        // Procurar pela aba correta de estoque (pode ser "Planilha1" ou a segunda aba)
        let sheetName = workbook.SheetNames[0];
        
        // Se houver múltiplas abas, procurar por "Planilha1" ou usar a segunda aba
        if (workbook.SheetNames.length > 1) {
          const planilha1Index = workbook.SheetNames.findIndex(name => name === "Planilha1");
          if (planilha1Index !== -1) {
            sheetName = workbook.SheetNames[planilha1Index];
            console.log(`[Stock Upload] Usando aba: ${sheetName}`);
          } else {
            // Se não encontrar "Planilha1", usar a segunda aba
            sheetName = workbook.SheetNames[1];
            console.log(`[Stock Upload] Usando segunda aba: ${sheetName}`);
          }
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        // Get products and channels
        const products = await getAllProducts();
        const channels = await getAllChannels();
        
        // Find column indices from header row
        const headerRow = data[0] as string[];
        
        console.log("Headers encontrados:", headerRow);
        
        // Mapeamento de colunas - buscar por padrões na sua planilha
        // FULL columns por marketplace (CNM + Brinquei)
        const fullColumns: Record<string, string[]> = {
          "Mercado Livre": ["ML FUL CNM ", "FUL BRINQUEI"],
          "Magalu": ["MAGALU FUL CNM", "MAGALU FUL BRIN"],
          "Amazon": ["AMAZON FUL CNM", "AMAZON FUL BRQ"],
          "Shopee": ["SHOPEE FULL BRI", "SHOPEE FULL CNM"],
          "TikTok": ["TK FULL BRINQUEI", "TK FULL CNM"],
        };
        
        // CROSS columns (sempre os mesmos para todos os marketplaces)
        const crossColumns = ["CNM MIND", "BRINQUEI MIND"];
        
        // Find column index for internal code
        let internalCodeIdx = -1;
        headerRow.forEach((col, idx) => {
          const colLower = (col || "").toString().toLowerCase().trim();
          if (colLower.includes("cód") && colLower.includes("interno")) {
            internalCodeIdx = idx;
          }
        });
        
        // Find column indices for FULL stocks
        const fullColumnIndices: Record<string, number[]> = {};
        for (const [marketplace, cols] of Object.entries(fullColumns)) {
          fullColumnIndices[marketplace] = [];
          for (const col of cols) {
            const idx = headerRow.findIndex(h => h === col);
            if (idx !== -1) {
              fullColumnIndices[marketplace].push(idx);
            }
          }
        }
        
        // Find column indices for CROSS stocks
        const crossColumnIndices: number[] = [];
        for (const col of crossColumns) {
          const idx = headerRow.findIndex(h => h === col);
          if (idx !== -1) {
            crossColumnIndices.push(idx);
          }
        }
        
        console.log(`[Stock Upload] Column indices encontrados:`, { internalCodeIdx, fullColumnIndices, crossColumnIndices });
        
        let recordsImported = 0;
        
        console.log(`[Stock Upload] Iniciando processamento de ${data.length - 1} linhas...`);
        
        // Process each data row
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as (string | number)[];
          if (!row || row.length === 0) continue;
          
          const internalCode = row[internalCodeIdx]?.toString().trim();
          if (!internalCode) continue;
          
          // Find product by internal code
          const product = products.find(p => p.internalCode === internalCode);
          if (!product) continue;
          
          // Calculate CROSS stock (soma de CNM MIND + BRINQUEI MIND)
          let totalCrossStock = 0;
          for (const idx of crossColumnIndices) {
            const value = row[idx]?.toString() || "0";
            totalCrossStock += Math.max(0, parseInt(value) || 0);
          }
          
          // Process FULL stock for each marketplace
          for (const [marketplace, cols] of Object.entries(fullColumns)) {
            const channel = channels.find(c => c.name === marketplace);
            if (!channel) continue;
            
            // Calculate FULL stock for this marketplace (soma de CNM + Brinquei)
            let totalFullStock = 0;
            const indices = fullColumnIndices[marketplace] || [];
            for (const idx of indices) {
              const value = row[idx]?.toString() || "0";
              totalFullStock += Math.max(0, parseInt(value) || 0);
            }
            
            // Save to database (sempre salvar, mesmo que seja 0)
            await upsertProductChannelStockType(
              product.id,
              channel.id,
              totalFullStock,
              totalCrossStock
            );
            
            recordsImported++;
          }
        }
        
        console.log(`[Stock Upload] Importação concluída! ${recordsImported} registros atualizados`);
        
        return {
          success: true,
          recordsImported,
          message: `✅ Importação concluída: ${recordsImported} registros de estoque atualizados`,
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
});
