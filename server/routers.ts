import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { stockRouter } from "./routers/stock";
import { goalsRouter } from "./routers/goals";
import { listingsRouter } from "./routers/listings";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as XLSX from "xlsx";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { extractMercadoLivrePrice } from "./mercadolivre";
import {
  getAllProducts,
  getAllChannels,
  updateProductGoal,
  updateProductNotes,
  updateProductInfo,
  getProductMarketplaceNote,
  upsertProductMarketplaceNote,
  updateChannelGoal,
  upsertProductChannelGoal,
  getAllProductChannelGoals,
  upsertDailySale,
  getProductSalesWithChannels,
  getProductSalesWithChannelsByPeriod,
  getMonthlyAverages,
  getDailyTotals,
  logImportedFile,
  getImportedFiles,
  isFileAlreadyImported,
  initializeDatabase,
  getProductById,
  getProductSalesHistory,
  getProductChannelSummary,
  clearAllSalesData,
  getProductsInsights,
  updateProductCategory,
  updateProductImage,
  getUniqueCategories,
  upsertProduct,
  initializeProductChannelGoalsForProduct,
  getSalesByMarketplace,
  getProductChannelHistory,
  deleteImportedFile,
  upsertProductStock,
  upsertMarketplaceStock,
  getAllProductsWithStock,
  getProductChannelStockType,
  getProductChannelStockTypes,
  getRevenueByCategory,
  generateSalesReport,
  getProductsWithoutCategoryWithSales,
  getMarketplaceInsights,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  stock: stockRouter,
  goals: goalsRouter,
  listings: listingsRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Initialize database with products and channels
  init: router({
    seed: protectedProcedure.mutation(async () => {
      await initializeDatabase();
      return { success: true };
    }),
  }),

  // Data management
  data: router({
    // Clear all sales and import data
    clearAll: protectedProcedure.mutation(async () => {
      const result = await clearAllSalesData();
      return {
        success: true,
        ...result,
      };
    }),
  }),

  // Categories management
  categories: router({
    list: publicProcedure.query(async () => {
      return getUniqueCategories();
    }),
    
    import: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Decode base64 file
        const buffer = Buffer.from(input.fileBase64, 'base64');
        
        // Parse XLS file
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
        
        // Find header row (look for "Código Interno" and "Categoria")
        let headerRowIndex = -1;
        let codeColIndex = -1;
        let categoryColIndex = -1;
        
        for (let i = 0; i < Math.min(5, data.length); i++) {
          const row = data[i];
          if (Array.isArray(row)) {
            for (let j = 0; j < row.length; j++) {
              const cell = String(row[j] || '').toLowerCase();
              if (cell.includes('código interno') || cell.includes('codigo interno')) {
                codeColIndex = j;
                headerRowIndex = i;
              }
              if (cell.includes('categoria')) {
                categoryColIndex = j;
              }
            }
          }
          if (headerRowIndex >= 0) break;
        }
        
        if (headerRowIndex < 0 || codeColIndex < 0 || categoryColIndex < 0) {
          throw new Error('Formato inválido: não encontrou colunas Código Interno e Categoria');
        }
        
        // Process data rows
        let updatedCount = 0;
        for (let i = headerRowIndex + 1; i < data.length; i++) {
          const row = data[i];
          if (!Array.isArray(row)) continue;
          
          const internalCode = String(row[codeColIndex] || '').trim();
          const category = String(row[categoryColIndex] || '').trim();
          
          if (internalCode && category) {
            await updateProductCategory(internalCode, category);
            updatedCount++;
          }
        }
        
        return {
          success: true,
          updatedCount,
        };
      }),
  }),

  // Import product images from spreadsheet
  images: router({
    import: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Decode base64 file
        const buffer = Buffer.from(input.fileBase64, 'base64');
        
        // Parse XLS file
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
        
        // Find header row (look for "Cód. Interno" and "URL IMAGEM")
        let headerRowIndex = -1;
        let codeColIndex = -1;
        let imageColIndex = -1;
        
        for (let i = 0; i < Math.min(5, data.length); i++) {
          const row = data[i];
          if (Array.isArray(row)) {
            for (let j = 0; j < row.length; j++) {
              const cell = String(row[j] || '').toLowerCase();
              if (cell.includes('cód. interno') || cell.includes('cod. interno') || cell.includes('código interno')) {
                codeColIndex = j;
              }
              if (cell.includes('url imagem') || cell.includes('imagem') || cell.includes('image')) {
                imageColIndex = j;
              }
            }
            if (codeColIndex !== -1 && imageColIndex !== -1) {
              headerRowIndex = i;
              break;
            }
          }
        }
        
        if (headerRowIndex === -1 || codeColIndex === -1 || imageColIndex === -1) {
          throw new Error('Colunas "Cód. Interno" e "URL IMAGEM" não encontradas na planilha');
        }
        
        // Process data rows
        let updatedCount = 0;
        for (let i = headerRowIndex + 1; i < data.length; i++) {
          const row = data[i];
          if (!Array.isArray(row)) continue;
          
          const internalCode = String(row[codeColIndex] || '').trim();
          const imageUrl = String(row[imageColIndex] || '').trim();
          
          if (internalCode && imageUrl) {
            await updateProductImage(internalCode, imageUrl);
            updatedCount++;
          }
        }
        
        return {
          success: true,
          updatedCount,
        };
      }),
  }),

  // Import new products from spreadsheet
  importProducts: router({
    upload: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Decode base64 file
        const buffer = Buffer.from(input.fileBase64, 'base64');
        
        // Parse XLS file
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
        
        // Find header row (look for "Cód. ID", "Cód. Interno", "Descrição")
        let headerRowIndex = -1;
        let idColIndex = -1;
        let codeColIndex = -1;
        let descColIndex = -1;
        
        for (let i = 0; i < Math.min(5, data.length); i++) {
          const row = data[i];
          if (Array.isArray(row)) {
            for (let j = 0; j < row.length; j++) {
              const cell = String(row[j] || '').toLowerCase();
              if (cell.includes('cód. id') || cell.includes('cod. id') || cell.includes('cód id')) {
                idColIndex = j;
              }
              if (cell.includes('cód. interno') || cell.includes('cod. interno') || cell.includes('código interno')) {
                codeColIndex = j;
              }
              if (cell.includes('descrição') || cell.includes('descricao')) {
                descColIndex = j;
              }
            }
            if (idColIndex !== -1 && codeColIndex !== -1 && descColIndex !== -1) {
              headerRowIndex = i;
              break;
            }
          }
        }
        
        if (headerRowIndex === -1) {
          throw new Error('Cabeçalho não encontrado. Certifique-se que a planilha tem colunas "Cód. ID", "Cód. Interno" e "Descrição"');
        }
        
        // Process data rows
        let addedCount = 0;
        let updatedCount = 0;
        
        for (let i = headerRowIndex + 1; i < data.length; i++) {
          const row = data[i];
          if (!Array.isArray(row)) continue;
          
          const externalId = Number(row[idColIndex]) || 0;
          const internalCode = String(row[codeColIndex] || '').trim();
          const description = String(row[descColIndex] || '').trim();
          
          if (externalId && internalCode && description) {
            const productId = await upsertProduct(externalId, internalCode, description);
            
            if (productId) {
              // Initialize channel goals for new product
              await initializeProductChannelGoalsForProduct(productId);
              addedCount++;
            }
          }
        }
        
        // Save to S3 for backup
        const fileKey = `products/${nanoid()}-${input.fileName}`;
        await storagePut(fileKey, buffer, 'application/vnd.ms-excel');
        
        return {
          success: true,
          addedCount,
          fileKey,
        };
      }),
  }),

  // Insights - products meeting vs not meeting goals
  insights: router({
    byPeriod: publicProcedure
      .input(z.object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(async ({ input }) => {
        return getProductsInsights(input.startDate, input.endDate);
      }),
    
    byMarketplace: publicProcedure
      .input(z.object({
        channelId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
        periodDays: z.number(),
      }))
      .query(async ({ input }) => {
        return getMarketplaceInsights(
          input.channelId,
          input.startDate,
          input.endDate,
          input.periodDays
        );
      }),
  }),

  // Marketplace view - sales by channel
  marketplace: router({
    byChannel: publicProcedure
      .input(z.object({
        channelId: z.number(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(async ({ input }) => {
        return getSalesByMarketplace(input.channelId, input.startDate, input.endDate);
      }),
    
    productHistory: publicProcedure
      .input(z.object({
        productId: z.number(),
        channelId: z.number(),
        days: z.number().optional().default(30),
      }))
      .query(async ({ input }) => {
        return getProductChannelHistory(input.productId, input.channelId, input.days);
      }),
    
    revenueByCategory: publicProcedure
      .input(z.object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(async ({ input }) => {
        return getRevenueByCategory(input.startDate, input.endDate);
      }),
    
    downloadReport: publicProcedure
      .input(z.object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(async ({ input }) => {
        return generateSalesReport(input.startDate, input.endDate);
      }),
  }),

  // Products management
  products: router({
    list: publicProcedure.query(async () => {
      return getAllProducts();
    }),
    
    // Get single product by ID
    byId: publicProcedure
      .input(z.object({
        productId: z.number(),
      }))
      .query(async ({ input }) => {
        return getProductById(input.productId);
      }),
    
    // Get product sales history for a date range
    history: publicProcedure
      .input(z.object({
        productId: z.number(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(async ({ input }) => {
        return getProductSalesHistory(input.productId, input.startDate, input.endDate);
      }),
    
    // Get product channel summary for a date range
    channelSummary: publicProcedure
      .input(z.object({
        productId: z.number(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(async ({ input }) => {
        return getProductChannelSummary(input.productId, input.startDate, input.endDate);
      }),
    
    updateGoal: protectedProcedure
      .input(z.object({
        productId: z.number(),
        dailyGoal: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        await updateProductGoal(input.productId, input.dailyGoal);
        return { success: true };
      }),
    
    updateNotes: protectedProcedure
      .input(z.object({
        productId: z.number(),
        notes: z.string().max(5000),
      }))
      .mutation(async ({ input }) => {
        await updateProductNotes(input.productId, input.notes);
        return { success: true };
      }),
    
    getMarketplaceNote: publicProcedure
      .input(z.object({
        productId: z.number(),
        channelId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getProductMarketplaceNote(input.productId, input.channelId);
      }),
    
    updateMarketplaceNote: protectedProcedure
      .input(z.object({
        productId: z.number(),
        channelId: z.number(),
        notes: z.string().max(5000),
      }))
      .mutation(async ({ input }) => {
        await upsertProductMarketplaceNote(input.productId, input.channelId, input.notes);
        return { success: true };
      })
    ,
    updateInfo: protectedProcedure
      .input(z.object({
        productId: z.number(),
        description: z.string().max(255).optional(),
        internalCode: z.string().max(50).optional(),
        category: z.string().max(100).optional(),
      }))
      .mutation(async ({ input }) => {
        await updateProductInfo(input.productId, {
          description: input.description,
          internalCode: input.internalCode,
          category: input.category,
        });
        return { success: true };
      }),
    withoutCategory: publicProcedure
      .input(z.object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(async ({ input }) => {
        return getProductsWithoutCategoryWithSales(input.startDate, input.endDate);
      }),
  }),

  // Channels management
  channels: router({
    list: publicProcedure.query(async () => {
      return getAllChannels();
    }),
    
    updateGoal: protectedProcedure
      .input(z.object({
        channelId: z.number(),
        dailyGoal: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        await updateChannelGoal(input.channelId, input.dailyGoal);
        return { success: true };
      }),
  }),

  // Product Channel Stock Types
  productChannelStock: router({
    getByProductAndChannel: publicProcedure
      .input(z.object({
        productId: z.number(),
        channelId: z.number(),
      }))
      .query(async ({ input }) => {
        return getProductChannelStockType(input.productId, input.channelId);
      }),
    
    getByProduct: publicProcedure
      .input(z.object({
        productId: z.number(),
      }))
      .query(async ({ input }) => {
        return getProductChannelStockTypes(input.productId);
      }),
  }),

  // Product-Channel goals
  productChannelGoals: router({
    list: publicProcedure.query(async () => {
      return getAllProductChannelGoals();
    }),
    
    update: protectedProcedure
      .input(z.object({
        productId: z.number(),
        channelId: z.number(),
        dailyGoal: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        await upsertProductChannelGoal(input.productId, input.channelId, input.dailyGoal);
        return { success: true };
      }),
  }),

  // Sales data
  sales: router({
    // Get all channels
    channels: publicProcedure.query(async () => {
      return getAllChannels();
    }),

    // Get sales for a specific date with all products and channels
    byDate: publicProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(async ({ input }) => {
        return getProductSalesWithChannels(input.date);
      }),
    
    // Get monthly averages
    monthlyAverages: publicProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ input }) => {
        return getMonthlyAverages(input.year, input.month);
      }),
    
    // Get daily totals for chart
    dailyTotals: publicProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ input }) => {
        return getDailyTotals(input.year, input.month);
      }),
    
    // Get sales for a date range (period)
    byPeriod: publicProcedure
      .input(z.object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(async ({ input }) => {
        return getProductSalesWithChannelsByPeriod(input.startDate, input.endDate);
      }),
  }),

  // File import
  import: router({
    // Get list of imported files
    list: publicProcedure.query(async () => {
      return getImportedFiles();
    }),
    
    // Check if file date already imported
    checkDate: publicProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(async ({ input }) => {
        const exists = await isFileAlreadyImported(input.date);
        return { exists };
      }),
    
    // Process uploaded XLS file
    processFile: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileBase64: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate filename format DD-MM-YYYY.xls
        const fileNameMatch = input.fileName.match(/^(\d{2})-(\d{2})-(\d{4})\.xls$/i);
        if (!fileNameMatch) {
          throw new Error("Nome do arquivo deve ser no formato DD-MM-YYYY.xls");
        }
        
        const [, day, month, year] = fileNameMatch;
        const fileDate = `${year}-${month}-${day}`;
        
        // Check if already imported
        const alreadyImported = await isFileAlreadyImported(fileDate);
        if (alreadyImported) {
          throw new Error(`Arquivo para a data ${day}/${month}/${year} já foi importado`);
        }
        
        // Decode base64 and parse XLS
        const buffer = Buffer.from(input.fileBase64, "base64");
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
          } else if (colLower === "faturamento" || colLower.includes("faturamento")) {
            columnIndices["faturamento"] = idx;
          }
        });
        
        let recordsImported = 0;
        
        // Track which products were found in the spreadsheet
        const productsFoundInSheet = new Set<number>();
        
        // Process each data row
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as (string | number)[];
          if (!row || row.length === 0) continue;
          
          const internalCode = row[columnIndices["internalCode"]]?.toString().trim();
          if (!internalCode) continue;
          
          // Find product by internal code
          const product = products.find(p => p.internalCode === internalCode);
          if (!product) continue;
          
          productsFoundInSheet.add(product.id);
          
          // First, get the total revenue for this product/day
          const revenueColIdx = columnIndices["faturamento"];
          let totalRevenue = 0;
          if (revenueColIdx !== undefined) {
            const revenueValue = parseFloat(row[revenueColIdx]?.toString().replace(',', '.') || "0") || 0;
            totalRevenue = Math.round(revenueValue * 100); // Convert to centavos
          }
          
          // Calculate total sales across all channels to distribute revenue proportionally
          let totalQuantity = 0;
          const channelQuantities: Record<string, number> = {};
          for (const [channelName] of Object.entries(channelMap)) {
            const colIdx = columnIndices[channelName];
            if (colIdx === undefined) continue;
            const quantity = parseInt(row[colIdx]?.toString() || "0", 10) || 0;
            channelQuantities[channelName] = quantity;
            totalQuantity += quantity;
          }
          
          // Process each channel - distribute revenue proportionally based on quantity
          for (const [channelName, channelId] of Object.entries(channelMap)) {
            const colIdx = columnIndices[channelName];
            if (colIdx === undefined) continue;
            
            const quantity = channelQuantities[channelName] || 0;
            // Distribute revenue proportionally based on quantity sold in each channel
            let channelRevenue = 0;
            if (totalQuantity > 0 && totalRevenue > 0) {
              channelRevenue = Math.round((quantity / totalQuantity) * totalRevenue);
            }
            await upsertDailySale(product.id, channelId, fileDate, quantity, channelRevenue);
            recordsImported++;
          }
        }
        
        // Register zero sales for products NOT in the spreadsheet
        for (const product of products) {
          if (!productsFoundInSheet.has(product.id)) {
            // Product not in spreadsheet = zero sales for all channels
            for (const channelId of Object.values(channelMap)) {
              await upsertDailySale(product.id, channelId, fileDate, 0, 0);
              recordsImported++;
            }
          }
        }
        
        // Upload file to S3 for backup
        const s3Key = `sales-imports/${year}/${month}/${input.fileName}-${nanoid(8)}`;
        const { url: s3Url } = await storagePut(s3Key, buffer, "application/vnd.ms-excel");
        
        // Log imported file
        await logImportedFile({
          fileName: input.fileName,
          fileDate: new Date(fileDate),
          s3Key,
          s3Url,
          recordsImported,
          importedBy: ctx.user?.id,
        });
        
        return {
          success: true,
          recordsImported,
          fileDate,
          s3Url,
        };
      }),
      
      deleteFile: protectedProcedure
        .input(z.object({
          fileId: z.number(),
        }))
        .mutation(async ({ input }) => {
          const success = await deleteImportedFile(input.fileId);
          if (!success) {
            throw new Error("Falha ao deletar arquivo");
          }
          return { success: true };
        }),
  }),

  mercadolivre: router({
    consultPrice: protectedProcedure
      .input(z.object({
        url: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        return await extractMercadoLivrePrice(input.url);
      }),
  }),

});

export type AppRouter = typeof appRouter;
