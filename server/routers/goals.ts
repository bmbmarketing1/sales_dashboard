import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as XLSX from "xlsx";
import {
  getAllProducts,
  getAllChannels,
  upsertProductChannelGoal,
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
        
        // Process each data row
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as (string | number)[];
          if (!row || row.length === 0) continue;
          
          const internalCode = row[columnIndices["internalCode"]]?.toString().trim();
          if (!internalCode) continue;
          
          // Find product by internal code
          const product = products.find(p => p.internalCode === internalCode);
          if (!product) continue;
          
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
        }
        
        console.log(`[Goals Import] ${recordsImported} metas importadas com sucesso`);
        
        return {
          success: true,
          recordsImported,
        };
      } catch (error) {
        console.error("[Goals Import] Erro:", error);
        throw new Error(`Erro ao importar metas: ${error instanceof Error ? error.message : 'Desconhecido'}`);
      }
    }),
});
