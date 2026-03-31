import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "../db";
import * as XLSX from "xlsx";
import { goalsRouter } from "./goals";

// Mock do módulo db
vi.mock("../db", () => ({
  getAllProducts: vi.fn(),
  getAllChannels: vi.fn(),
  upsertProductChannelGoal: vi.fn(),
  updateProductGoal: vi.fn(),
}));

describe("Goals Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("importFromFile", () => {
    it("deve processar arquivo Excel com metas corretamente", async () => {
      // Criar arquivo Excel de teste
      const data = [
        ["Cód. Interno", "Amazon", "Magalu", "Mercado Livre", "Shopee", "TikTok"],
        ["BQ001", 10, 5, 3, 2, 1],
        ["BQ002", 8, 4, 2, 1, 0],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Metas");
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      const fileBase64 = buffer.toString("base64");

      // Mock dos dados
      const mockProducts = [
        {
          id: 1,
          internalCode: "BQ001",
          description: "Produto 1",
          category: "Brinquedos",
          externalId: 1,
          dailyGoal: 0,
          imageUrl: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          internalCode: "BQ002",
          description: "Produto 2",
          category: "Brinquedos",
          externalId: 2,
          dailyGoal: 0,
          imageUrl: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockChannels = [
        { id: 1, name: "Amazon", dailyGoal: 100, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: "Magalu", dailyGoal: 100, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, name: "Mercado Livre", dailyGoal: 100, createdAt: new Date(), updatedAt: new Date() },
        { id: 4, name: "Shopee", dailyGoal: 100, createdAt: new Date(), updatedAt: new Date() },
        { id: 5, name: "TikTok", dailyGoal: 100, createdAt: new Date(), updatedAt: new Date() },
      ];

      vi.mocked(db.getAllProducts).mockResolvedValue(mockProducts);
      vi.mocked(db.getAllChannels).mockResolvedValue(mockChannels);
      vi.mocked(db.upsertProductChannelGoal).mockResolvedValue();
      vi.mocked(db.updateProductGoal).mockResolvedValue();

      // Executar mutation com contexto de usuário
      const mockUser = { id: 1, openId: "test", role: "admin" as const };
      const caller = goalsRouter.createCaller({ user: mockUser });
      const result = await caller.importFromFile({
        fileName: "metas.xlsx",
        fileBase64,
      });

      // Verificações
      expect(result.success).toBe(true);
      expect(result.recordsImported).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(result.summary).toContain("com sucesso");
    });

    it("deve retornar erro quando SKU não existe", async () => {
      const data = [
        ["Cód. Interno", "Amazon", "Magalu"],
        ["INEXISTENTE", 10, 5],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Metas");
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      const fileBase64 = buffer.toString("base64");

      const mockChannels = [
        { id: 1, name: "Amazon", dailyGoal: 100, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: "Magalu", dailyGoal: 100, createdAt: new Date(), updatedAt: new Date() },
      ];

      vi.mocked(db.getAllProducts).mockResolvedValue([]);
      vi.mocked(db.getAllChannels).mockResolvedValue(mockChannels);

      const mockUser = { id: 1, openId: "test", role: "admin" as const };
      const caller = goalsRouter.createCaller({ user: mockUser });
      const result = await caller.importFromFile({
        fileName: "metas.xlsx",
        fileBase64,
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error).toContain("não encontrado");
    });

    it("deve retornar erro quando arquivo está vazio", async () => {
      const data = [["Cód. Interno", "Amazon"]];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Metas");
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      const fileBase64 = buffer.toString("base64");

      const mockUser = { id: 1, openId: "test", role: "admin" as const };
      const caller = goalsRouter.createCaller({ user: mockUser });
      const result = await caller.importFromFile({
        fileName: "metas.xlsx",
        fileBase64,
      });

      expect(result.success).toBe(false);
      expect(result.summary).toContain("Erro");
    });

    it("deve atualizar meta diária total do produto", async () => {
      const data = [
        ["Cód. Interno", "Amazon", "Magalu"],
        ["BQ001", 10, 5],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Metas");
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      const fileBase64 = buffer.toString("base64");

      const mockProducts = [
        {
          id: 1,
          internalCode: "BQ001",
          description: "Produto 1",
          category: "Brinquedos",
          externalId: 1,
          dailyGoal: 0,
          imageUrl: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockChannels = [
        { id: 1, name: "Amazon", dailyGoal: 100, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: "Magalu", dailyGoal: 100, createdAt: new Date(), updatedAt: new Date() },
      ];

      vi.mocked(db.getAllProducts).mockResolvedValue(mockProducts);
      vi.mocked(db.getAllChannels).mockResolvedValue(mockChannels);
      vi.mocked(db.upsertProductChannelGoal).mockResolvedValue();
      vi.mocked(db.updateProductGoal).mockResolvedValue();

      const mockUser = { id: 1, openId: "test", role: "admin" as const };
      const caller = goalsRouter.createCaller({ user: mockUser });
      const result = await caller.importFromFile({
        fileName: "metas.xlsx",
        fileBase64,
      });

      // Verificar que updateProductGoal foi chamado com a soma das metas (10 + 5 = 15)
      expect(vi.mocked(db.updateProductGoal)).toHaveBeenCalledWith(1, 15);
    });
  });
});
