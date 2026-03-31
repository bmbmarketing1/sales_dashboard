import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as XLSX from "xlsx";
import {
  getAllProducts,
  getAllChannels,
  upsertProductChannelGoal,
  updateProductGoal,
} from "../db";

export const goalsRouter = router({
  importFromFile: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileBase64: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[Goals Import] Iniciando import de metas: ${input.fileName}`);
        
        // Decode base64
        const buffer = Buffer.from(input.fileBase64, "base64");
        
        // Read spreadsheet
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        if (data.length < 2) {
          throw new Error("Arquivo Excel deve conter pelo menos 1 linha de dados (além do cabeçalho)");
        }
        
        // Get products and channels
        const products = await getAllProducts();
        const channels = await getAllChannels();
        
        // Create channel name to ID map
        const channelMap: Record<string, number> = {};
        channels.forEach(ch => {
          channelMap[ch.name.toLowerCase()] = ch.id;
        });
        
        // Find column indices from header row
        const headerRow = data[0] as string[];
        const columnIndices: Record<string, number> = {};
        
        headerRow.forEach((col, idx) => {
          const colLower = (col || "").toString().toLowerCase().trim();
          if (colLower.includes("cód") && colLower.includes("interno")) {
            columnIndices["internalCode"] = idx;
          } else if (colLower === "amazon") {
            columnIndices["amazon"] = idx;
          } else if (colLower === "magalu") {
            columnIndices["magalu"] = idx;
          } else if (colLower.includes("mercado") && colLower.includes("livre")) {
            columnIndices["mercado livre"] = idx;
          } else if (colLower === "shopee") {
            columnIndices["shopee"] = idx;
          } else if (colLower === "tiktok") {
            columnIndices["tiktok"] = idx;
          }
        });
        
        let recordsImported = 0;
        const errors: Array<{ row: number; sku: string; error: string }> = [];
        
        // Process each data row
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as (string | number)[];
          if (!row || row.length === 0) continue;
          
          const internalCode = row[columnIndices["internalCode"]]?.toString().trim();
          if (!internalCode) continue;
          
          // Find product by internal code
          const product = products.find(p => p.internalCode === internalCode);
          if (!product) {
            errors.push({
              row: i + 1,
              sku: internalCode,
              error: `SKU/Código não encontrado: ${internalCode}`,
            });
            continue;
          }
          
          try {
            // Process each channel goal
            for (const [channelName, channelId] of Object.entries(channelMap)) {
              const colIdx = columnIndices[channelName];
              if (colIdx === undefined) continue;
              
              const goal = parseInt(row[colIdx]?.toString() || "0", 10) || 0;
              if (goal > 0) {
                await upsertProductChannelGoal(product.id, channelId, goal);
                recordsImported++;
              }
            }
            
            // Também atualizar meta diária total do produto (soma de todos os canais)
            const totalDailyGoal = Object.entries(channelMap).reduce((sum, [channelName]) => {
              const colIdx = columnIndices[channelName];
              if (colIdx === undefined) return sum;
              const goal = parseInt(row[colIdx]?.toString() || "0", 10) || 0;
              return sum + goal;
            }, 0);
            
            if (totalDailyGoal > 0) {
              await updateProductGoal(product.id, totalDailyGoal);
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
            errors.push({
              row: i + 1,
              sku: internalCode,
              error: errorMsg,
            });
          }
        }
        
        console.log(`[Goals Import] ${recordsImported} metas importadas com sucesso. ${errors.length} erros encontrados.`);
        
        return {
          success: errors.length === 0,
          recordsImported,
          totalRows: data.length - 1,
          errors,
          summary: `${recordsImported} metas atualizadas com sucesso. ${errors.length} erros encontrados.`,
        };
      } catch (error) {
        console.error("[Goals Import] Erro:", error);
        const errorMsg = error instanceof Error ? error.message : 'Desconhecido';
        return {
          success: false,
          recordsImported: 0,
          totalRows: 0,
          errors: [{ row: 0, sku: "", error: errorMsg }],
          summary: `Erro ao importar metas: ${errorMsg}`,
        };
      }
    }),
});
