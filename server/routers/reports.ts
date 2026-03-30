import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as XLSX from "xlsx";
import { getAllProducts, getAllChannels, getSalesByMarketplace } from "../db";
import { storagePut } from "../storage";

/**
 * Gera um relatório em Excel com:
 * - Aba 1: Consolidado (vendas totais de todos os marketplaces)
 * - Aba 2+: Por Marketplace (vendas separadas por canal)
 * 
 * Otimizado para chamar getSalesByMarketplace apenas uma vez por canal
 * 
 * @param startDate Data inicial (YYYY-MM-DD)
 * @param endDate Data final (YYYY-MM-DD)
 * @param categories Array de categorias para filtrar (vazio = todas)
 */
export async function generateMarketplaceReportExcel(
  startDate: string,
  endDate: string,
  categories?: string[]
): Promise<Buffer> {
  console.log('[generateMarketplaceReportExcel] Starting with:', { startDate, endDate, categories });
  
  try {
    let allProducts = await getAllProducts();
    console.log('[generateMarketplaceReportExcel] Loaded products:', allProducts.length);
    
    // Filtrar produtos por categorias se especificadas
    if (categories && categories.length > 0) {
      allProducts = allProducts.filter(p => 
        p.category && categories.includes(p.category)
      );
      console.log('[generateMarketplaceReportExcel] Filtered products:', allProducts.length);
    }
    
    const allChannels = await getAllChannels();
    console.log('[generateMarketplaceReportExcel] Loaded channels:', allChannels.length);

    // Calcular dias no período
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    console.log('[generateMarketplaceReportExcel] Days in period:', daysInPeriod);

    // ============ OTIMIZAÇÃO: Chamar getSalesByMarketplace uma vez por canal ============
    console.log('[generateMarketplaceReportExcel] Fetching data from all channels in parallel...');
    const perChannelData = await Promise.all(
      allChannels.map(channel => 
        getSalesByMarketplace(channel.id, startDate, endDate).catch(err => {
          console.error('[generateMarketplaceReportExcel] Error fetching channel:', channel.id, err);
          return null;
        })
      )
    );

    // Criar mapa para acesso rápido: channelId -> marketplace data
    const channelDataMap = new Map<number, any>();
    allChannels.forEach((channel, idx) => {
      if (perChannelData[idx]) {
        channelDataMap.set(channel.id, perChannelData[idx]);
      }
    });
    console.log('[generateMarketplaceReportExcel] Channel data map created');

    // ============ ABA 1: CONSOLIDADO ============
    const consolidatedData = [];

    for (const product of allProducts) {
      const row: Record<string, any> = {
        "SKU": product.internalCode,
        "Produto": product.description,
        "Categoria": product.category || "-",
      };

      let totalConsolidatedSales = 0;
      let totalConsolidatedGoal = 0;

      // Somar vendas de todos os marketplaces (usando dados já carregados)
      for (const channel of allChannels) {
        const marketplaceData = channelDataMap.get(channel.id);
        if (!marketplaceData || !marketplaceData.products) continue;

        const productData = marketplaceData.products.find((p: any) => p.id === product.id);
        if (productData) {
          totalConsolidatedSales += productData.totalSales;
          totalConsolidatedGoal += productData.periodGoal;
        }
      }

      const consolidatedPercentage = totalConsolidatedGoal > 0 
        ? Math.round((totalConsolidatedSales / totalConsolidatedGoal) * 100) 
        : 0;

      const consolidatedAverage = daysInPeriod > 0 
        ? Math.round((totalConsolidatedSales / daysInPeriod) * 100) / 100 
        : 0;

      row["Vendas Total"] = totalConsolidatedSales;
      row["Meta Total"] = totalConsolidatedGoal;
      row["Atingimento %"] = consolidatedPercentage;
      row["Média/Dia"] = consolidatedAverage;

      consolidatedData.push(row);
    }
    console.log('[generateMarketplaceReportExcel] Consolidated data rows:', consolidatedData.length);

    // ============ ABAS POR MARKETPLACE ============
    const marketplaceSheets: Record<string, any[]> = {};

    for (const channel of allChannels) {
      const marketplaceData = channelDataMap.get(channel.id);
      if (!marketplaceData || !marketplaceData.products) {
        console.warn('[generateMarketplaceReportExcel] No marketplace data for channel:', channel.name);
        continue;
      }

      const sheetData = [];

      for (const product of marketplaceData.products) {
        // Filtrar produtos por categoria se especificadas
        if (categories && categories.length > 0) {
          if (!product.category || !categories.includes(product.category)) {
            continue;
          }
        }

        sheetData.push({
          "SKU": product.internalCode,
          "Produto": product.description,
          "Categoria": product.category || "-",
          "Vendas": product.totalSales,
          "Meta": product.periodGoal,
          "Atingimento %": product.percentage,
          "Média/Dia": product.averageDailySales,
          "Estoque FULL": product.fullStock,
        });
      }

      // Adicionar linha de totais (apenas se houver dados)
      if (sheetData.length > 0) {
        const totalSales = sheetData.reduce((sum, row) => sum + row["Vendas"], 0);
        const totalGoal = sheetData.reduce((sum, row) => sum + row["Meta"], 0);
        const totalPercentage = totalGoal > 0 ? Math.round((totalSales / totalGoal) * 100) : 0;

        sheetData.push({
          "SKU": "TOTAL",
          "Produto": "",
          "Categoria": "",
          "Vendas": totalSales,
          "Meta": totalGoal,
          "Atingimento %": totalPercentage,
          "Média/Dia": daysInPeriod > 0 ? Math.round((totalSales / daysInPeriod) * 100) / 100 : 0,
          "Estoque FULL": "",
        });

        marketplaceSheets[channel.name] = sheetData;
      }
    }
    console.log('[generateMarketplaceReportExcel] Marketplace sheets:', Object.keys(marketplaceSheets));

    // ============ CRIAR WORKBOOK ============
    const workbook = XLSX.utils.book_new();

    // Adicionar aba consolidada (apenas se houver dados)
    if (consolidatedData.length > 0) {
      const consolidatedSheet = XLSX.utils.json_to_sheet(consolidatedData);
      XLSX.utils.book_append_sheet(workbook, consolidatedSheet, "Consolidado");
    }

    // Adicionar abas por marketplace
    for (const [channelName, data] of Object.entries(marketplaceSheets)) {
      const sheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, sheet, channelName);
    }

    // Converter para buffer
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    console.log('[generateMarketplaceReportExcel] Generated buffer size:', buffer.length);
    return buffer;
  } catch (error) {
    console.error('[generateMarketplaceReportExcel] Error:', error);
    throw error;
  }
}

export const reportsRouter = router({
  exportMarketplaceReport: publicProcedure
    .input(z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      categories: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('[exportMarketplaceReport] Starting export with input:', input);
        
        const buffer = await generateMarketplaceReportExcel(
          input.startDate, 
          input.endDate,
          input.categories
        );
        
        console.log('[exportMarketplaceReport] Buffer generated, uploading to S3...');
        
        // Upload para S3 em vez de retornar base64
        const now = new Date();
        const categoryLabel = input.categories && input.categories.length > 0 
          ? `_${input.categories.join('-')}`
          : '';
        const fileName = `relatorio_vendas_${input.startDate}_${input.endDate}${categoryLabel}_${now.getTime()}.xlsx`;
        const fileKey = `reports/${fileName}`;
        
        const { url } = await storagePut(fileKey, buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        console.log('[exportMarketplaceReport] Export successful, S3 URL:', url);
        
        return {
          success: true,
          fileName,
          url, // Retornar URL do S3 em vez de base64
        };
      } catch (error) {
        console.error("[exportMarketplaceReport] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),
});
