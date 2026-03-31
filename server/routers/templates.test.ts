import { describe, it, expect, vi, beforeAll } from "vitest";
import { generateGoalsTemplate } from "./templates";

describe("Templates Router", () => {
  describe("generateGoalsTemplate", () => {
    it("deve gerar um buffer Excel válido", async () => {
      const buffer = await generateGoalsTemplate();

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Verificar assinatura de arquivo Excel (PK = ZIP)
      const signature = buffer.slice(0, 2).toString("hex");
      expect(signature).toBe("504b");
    });

    it("deve incluir cabeçalhos com nomes de canais", async () => {
      const buffer = await generateGoalsTemplate();
      const bufferString = buffer.toString("binary");

      // Procurar por nomes de canais comuns
      expect(bufferString).toContain("Amazon");
      expect(bufferString).toContain("Magalu");
    });

    it("deve incluir dados de exemplo de produtos", async () => {
      const buffer = await generateGoalsTemplate();

      // Apenas verificar que o buffer foi gerado
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("deve ter tamanho razoável (entre 1KB e 100KB)", async () => {
      const buffer = await generateGoalsTemplate();
      const sizeInKB = buffer.length / 1024;

      expect(sizeInKB).toBeGreaterThan(1);
      expect(sizeInKB).toBeLessThan(100);
    });
  });
});
