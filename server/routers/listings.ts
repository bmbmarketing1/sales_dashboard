import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as XLSX from "xlsx";
import {
  getAllProducts,
  getAllChannels,
  upsertProductListingLink,
  getProductListingLinks,
  deleteProductListingLink,
} from "../db";

export const listingsRouter = router({
  importFromFile: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileBase64: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[Listings Import] Iniciando import de links: ${input.fileName}`);
        
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
          if (colLower.includes("referência") || colLower.includes("referencia") || colLower.includes("código") || colLower.includes("codigo")) {
            columnIndices["reference"] = idx;
          } else if (colLower.includes("marketplace") || colLower.includes("canal")) {
            columnIndices["marketplace"] = idx;
          } else if (colLower.includes("link") || colLower.includes("url")) {
            columnIndices["link"] = idx;
          }
        });
        
        if (!columnIndices["reference"] || !columnIndices["marketplace"] || !columnIndices["link"]) {
          throw new Error("Colunas obrigatórias não encontradas: Referência, Marketplace, Link");
        }
        
        let recordsImported = 0;
        const importedLinks: Array<{ reference: string; marketplace: string; link: string }> = [];
        
        // Process each data row
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as (string | number)[];
          if (!row || row.length === 0) continue;
          
          const reference = row[columnIndices["reference"]]?.toString().trim();
          const marketplace = row[columnIndices["marketplace"]]?.toString().trim();
          const link = row[columnIndices["link"]]?.toString().trim();
          
          if (!reference || !marketplace || !link) continue;
          
          // Find product by internal code
          const product = products.find(p => p.internalCode === reference);
          if (!product) {
            console.warn(`[Listings Import] Produto não encontrado: ${reference}`);
            continue;
          }
          
          // Find channel by name
          const channelId = channelMap[marketplace.toLowerCase()];
          if (!channelId) {
            console.warn(`[Listings Import] Marketplace não encontrado: ${marketplace}`);
            continue;
          }
          
          // Save link
          await upsertProductListingLink(product.id, channelId, link);
          recordsImported++;
          importedLinks.push({ reference, marketplace, link });
        }
        
        console.log(`[Listings Import] ${recordsImported} links importados com sucesso`);
        
        return {
          success: true,
          recordsImported,
          importedLinks,
        };
      } catch (error) {
        console.error("[Listings Import] Erro:", error);
        throw new Error(`Erro ao importar links: ${error instanceof Error ? error.message : 'Desconhecido'}`);
      }
    }),

  getByProduct: protectedProcedure
    .input(z.object({
      productId: z.number(),
    }))
    .query(async ({ input }) => {
      return await getProductListingLinks(input.productId);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      productId: z.number(),
      channelId: z.number(),
      listingUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[Listings Update] Atualizando link ${input.id}`);
        await upsertProductListingLink(input.productId, input.channelId, input.listingUrl);
        return { success: true };
      } catch (error) {
        console.error("[Listings Update] Erro:", error);
        throw new Error(`Erro ao atualizar link: ${error instanceof Error ? error.message : 'Desconhecido'}`);
      }
    }),

  delete: protectedProcedure
    .input(z.object({
      productId: z.number(),
      channelId: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[Listings Delete] Deletando link do produto ${input.productId}, canal ${input.channelId}`);
        await deleteProductListingLink(input.productId, input.channelId);
        return { success: true };
      } catch (error) {
        console.error("[Listings Delete] Erro:", error);
        throw new Error(`Erro ao deletar link: ${error instanceof Error ? error.message : 'Desconhecido'}`);
      }
    }),

  create: protectedProcedure
    .input(z.object({
      productId: z.number(),
      channelId: z.number(),
      listingUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[Listings Create] Criando link para produto ${input.productId}, canal ${input.channelId}`);
        await upsertProductListingLink(input.productId, input.channelId, input.listingUrl);
        return { success: true };
      } catch (error) {
        console.error("[Listings Create] Erro:", error);
        throw new Error(`Erro ao criar link: ${error instanceof Error ? error.message : 'Desconhecido'}`);
      }
    }),
});
