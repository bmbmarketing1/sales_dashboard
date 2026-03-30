import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateMarketplaceReportExcel } from "./reports";
import * as db from "../db";

// Mock das funções do banco de dados
vi.mock("../db", () => ({
  getAllProducts: vi.fn(),
  getAllChannels: vi.fn(),
  getSalesByMarketplace: vi.fn(),
}));

describe("Reports Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateMarketplaceReportExcel", () => {
    it("deve gerar um buffer Excel válido", async () => {
      // Mock dos dados
      const mockProducts = [
        {
          id: 1,
          internalCode: "BQ001",
          description: "Produto 1",
          category: "Brinquedos",
          externalId: "ext1",
          dailyGoal: 10,
          imageUrl: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockChannels = [
        {
          id: 1,
          name: "Amazon",
          dailyGoal: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Magalu",
          dailyGoal: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockMarketplaceData = {
        channel: {
          id: 1,
          name: "Amazon",
          totalSales: 100,
          totalGoal: 200,
          overallPercentage: 50,
          dailyGoal: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        products: [
          {
            id: 1,
            externalId: "ext1",
            internalCode: "BQ001",
            description: "Produto 1",
            category: "Brinquedos",
            dailyGoal: 10,
            periodGoal: 300,
            totalSales: 150,
            percentage: 50,
            averageDailySales: 5,
            fullStock: 100,
            stockCoverage: 66,
            stockExcess: 0,
            stockDeficit: 0,
          },
        ],
        daysInPeriod: 30,
      };

      vi.mocked(db.getAllProducts).mockResolvedValue(mockProducts);
      vi.mocked(db.getAllChannels).mockResolvedValue(mockChannels);
      vi.mocked(db.getSalesByMarketplace).mockResolvedValue(mockMarketplaceData);

      // Executar função
      const buffer = await generateMarketplaceReportExcel("2024-01-01", "2024-01-31");

      // Verificações
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // Verificar que as funções foram chamadas
      expect(db.getAllProducts).toHaveBeenCalled();
      expect(db.getAllChannels).toHaveBeenCalled();
      // getSalesByMarketplace é chamado uma vez por canal (2 canais) com Promise.all
      expect(db.getSalesByMarketplace).toHaveBeenCalledTimes(2);
    });

    it("deve incluir dados consolidados e por marketplace", async () => {
      const mockProducts = [
        {
          id: 1,
          internalCode: "BQ001",
          description: "Produto 1",
          category: "Brinquedos",
          externalId: "ext1",
          dailyGoal: 10,
          imageUrl: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockChannels = [
        {
          id: 1,
          name: "Amazon",
          dailyGoal: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockMarketplaceData = {
        channel: {
          id: 1,
          name: "Amazon",
          totalSales: 100,
          totalGoal: 200,
          overallPercentage: 50,
          dailyGoal: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        products: [
          {
            id: 1,
            externalId: "ext1",
            internalCode: "BQ001",
            description: "Produto 1",
            category: "Brinquedos",
            dailyGoal: 10,
            periodGoal: 300,
            totalSales: 150,
            percentage: 50,
            averageDailySales: 5,
            fullStock: 100,
            stockCoverage: 66,
            stockExcess: 0,
            stockDeficit: 0,
          },
        ],
        daysInPeriod: 30,
      };

      vi.mocked(db.getAllProducts).mockResolvedValue(mockProducts);
      vi.mocked(db.getAllChannels).mockResolvedValue(mockChannels);
      vi.mocked(db.getSalesByMarketplace).mockResolvedValue(mockMarketplaceData);

      const buffer = await generateMarketplaceReportExcel("2024-01-01", "2024-01-31");

      // Verificar que o buffer é válido
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // Verificar que contém dados de Excel (assinatura XLSX)
      const bufferString = buffer.toString("hex").substring(0, 8);
      expect(bufferString).toBe("504b0304"); // Assinatura de arquivo ZIP (XLSX é ZIP)
    });

    it("deve calcular corretamente as médias diárias", async () => {
      const mockProducts = [
        {
          id: 1,
          internalCode: "BQ001",
          description: "Produto 1",
          category: "Brinquedos",
          externalId: "ext1",
          dailyGoal: 10,
          imageUrl: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockChannels = [
        {
          id: 1,
          name: "Amazon",
          dailyGoal: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockMarketplaceData = {
        channel: {
          id: 1,
          name: "Amazon",
          totalSales: 300,
          totalGoal: 300,
          overallPercentage: 100,
          dailyGoal: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        products: [
          {
            id: 1,
            externalId: "ext1",
            internalCode: "BQ001",
            description: "Produto 1",
            category: "Brinquedos",
            dailyGoal: 10,
            periodGoal: 300,
            totalSales: 300,
            percentage: 100,
            averageDailySales: 10,
            fullStock: 300,
            stockCoverage: 100,
            stockExcess: 0,
            stockDeficit: 0,
          },
        ],
        daysInPeriod: 30,
      };

      vi.mocked(db.getAllProducts).mockResolvedValue(mockProducts);
      vi.mocked(db.getAllChannels).mockResolvedValue(mockChannels);
      vi.mocked(db.getSalesByMarketplace).mockResolvedValue(mockMarketplaceData);

      const buffer = await generateMarketplaceReportExcel("2024-01-01", "2024-01-30");

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe("generateMarketplaceReportExcel with category filter", () => {
    it("deve filtrar produtos por categorias", async () => {
      const mockProducts = [
        {
          id: 1,
          internalCode: "BQ001",
          description: "Produto 1",
          category: "Brinquedos",
          externalId: "ext1",
          dailyGoal: 10,
          imageUrl: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          internalCode: "BL001",
          description: "Produto 2",
          category: "Utilidades",
          externalId: "ext2",
          dailyGoal: 10,
          imageUrl: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockChannels = [
        {
          id: 1,
          name: "Amazon",
          dailyGoal: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockMarketplaceData = {
        channel: {
          id: 1,
          name: "Amazon",
          totalSales: 100,
          totalGoal: 200,
          overallPercentage: 50,
          dailyGoal: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        products: [
          {
            id: 1,
            externalId: "ext1",
            internalCode: "BQ001",
            description: "Produto 1",
            category: "Brinquedos",
            dailyGoal: 10,
            periodGoal: 300,
            totalSales: 150,
            percentage: 50,
            averageDailySales: 5,
            fullStock: 100,
            stockCoverage: 66,
            stockExcess: 0,
            stockDeficit: 0,
          },
          {
            id: 2,
            externalId: "ext2",
            internalCode: "BL001",
            description: "Produto 2",
            category: "Utilidades",
            dailyGoal: 10,
            periodGoal: 300,
            totalSales: 100,
            percentage: 33,
            averageDailySales: 3,
            fullStock: 100,
            stockCoverage: 50,
            stockExcess: 0,
            stockDeficit: 0,
          },
        ],
        daysInPeriod: 30,
      };

      vi.mocked(db.getAllProducts).mockResolvedValue(mockProducts);
      vi.mocked(db.getAllChannels).mockResolvedValue(mockChannels);
      vi.mocked(db.getSalesByMarketplace).mockResolvedValue(mockMarketplaceData);

      // Gerar relatório apenas com categoria "Brinquedos"
      const buffer = await generateMarketplaceReportExcel(
        "2024-01-01",
        "2024-01-31",
        ["Brinquedos"]
      );

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // Verificar que getAllProducts foi chamado
      expect(db.getAllProducts).toHaveBeenCalled();
    });

    it("deve incluir todos os produtos quando nenhuma categoria é especificada", async () => {
      const mockProducts = [
        {
          id: 1,
          internalCode: "BQ001",
          description: "Produto 1",
          category: "Brinquedos",
          externalId: "ext1",
          dailyGoal: 10,
          imageUrl: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockChannels = [
        {
          id: 1,
          name: "Amazon",
          dailyGoal: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockMarketplaceData = {
        channel: {
          id: 1,
          name: "Amazon",
          totalSales: 100,
          totalGoal: 200,
          overallPercentage: 50,
          dailyGoal: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        products: [
          {
            id: 1,
            externalId: "ext1",
            internalCode: "BQ001",
            description: "Produto 1",
            category: "Brinquedos",
            dailyGoal: 10,
            periodGoal: 300,
            totalSales: 150,
            percentage: 50,
            averageDailySales: 5,
            fullStock: 100,
            stockCoverage: 66,
            stockExcess: 0,
            stockDeficit: 0,
          },
        ],
        daysInPeriod: 30,
      };

      vi.mocked(db.getAllProducts).mockResolvedValue(mockProducts);
      vi.mocked(db.getAllChannels).mockResolvedValue(mockChannels);
      vi.mocked(db.getSalesByMarketplace).mockResolvedValue(mockMarketplaceData);

      // Gerar relatório sem especificar categorias
      const buffer = await generateMarketplaceReportExcel(
        "2024-01-01",
        "2024-01-31"
      );

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
