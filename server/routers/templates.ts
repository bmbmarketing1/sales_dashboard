import { router, publicProcedure } from "../_core/trpc";
import * as XLSX from "xlsx";
import { getAllProducts, getAllChannels } from "../db";

/**
 * Gera arquivo Excel modelo para importação de metas
 * Inclui exemplos com dados reais de produtos
 */
export async function generateGoalsTemplate(): Promise<Buffer> {
  console.log("[generateGoalsTemplate] Starting template generation");

  try {
    // Buscar produtos e canais
    const products = await getAllProducts();
    const channels = await getAllChannels();

    if (!products || products.length === 0) {
      throw new Error("Nenhum produto encontrado no banco de dados");
    }

    if (!channels || channels.length === 0) {
      throw new Error("Nenhum canal encontrado no banco de dados");
    }

    // Criar cabeçalho com nome dos canais
    const headers = ["Cód. Interno", ...channels.map((ch) => ch.name)];

    // Preparar dados de exemplo (primeiros 5 produtos)
    const exampleProducts = products.slice(0, 5);
    const data: any[] = [headers];

    for (const product of exampleProducts) {
      const row = [product.internalCode];

      // Adicionar metas de exemplo para cada canal
      for (const channel of channels) {
        // Usar meta diária do produto dividida pelos canais como exemplo
        const exampleGoal = Math.ceil((product.dailyGoal || 10) / channels.length);
        row.push(exampleGoal.toString());
      }

      data.push(row);
    }

    // Adicionar linhas vazias para o usuário preencher
    for (let i = 0; i < 5; i++) {
      const emptyRow = ["", ...channels.map(() => "")];
      data.push(emptyRow);
    }

    // Criar workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Formatar cabeçalho (negrito)
    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center" },
    };

    // Aplicar estilo ao cabeçalho
    for (let colIdx = 0; colIdx < headers.length; colIdx++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIdx });
      if (!worksheet[cellRef]) worksheet[cellRef] = {};
      worksheet[cellRef].s = headerStyle;
    }

    // Definir largura das colunas
    worksheet["!cols"] = [
      { wch: 15 }, // Cód. Interno
      ...channels.map(() => ({ wch: 12 })), // Canais
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Metas");

    // Gerar buffer
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    console.log(`[generateGoalsTemplate] Template generated: ${buffer.length} bytes`);

    return buffer;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[generateGoalsTemplate] Error:", errorMsg);
    throw error;
  }
}

export const templatesRouter = router({
  downloadGoalsTemplate: publicProcedure.query(async () => {
    try {
      console.log("[downloadGoalsTemplate] Generating template");

      const buffer = await generateGoalsTemplate();

      // Converter para base64 para retornar via tRPC
      const base64 = buffer.toString("base64");

      return {
        success: true,
        fileName: `metas_template_${new Date().toISOString().split("T")[0]}.xlsx`,
        fileBase64: base64,
        fileSize: buffer.length,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("[downloadGoalsTemplate] Error:", errorMsg);
      return {
        success: false,
        error: errorMsg,
        fileName: "",
        fileBase64: "",
        fileSize: 0,
      };
    }
  }),
});
