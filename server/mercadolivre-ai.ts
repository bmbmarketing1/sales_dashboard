import { invokeLLM } from "./_core/llm";

/**
 * Extrai informações de preço do Mercado Livre usando IA
 * A IA acessa a URL e analisa a página para extrair:
 * - Preço atual
 * - Preço original (se em promoção)
 * - Percentual de desconto
 * - Disponibilidade
 */
export async function extractMercadoLivrePrice(url: string) {
  try {
    // Validar URL
    if (!url.includes("mercadolivre.com.br")) {
      return {
        price: null,
        originalPrice: null,
        discount: null,
        available: false,
        currency: "BRL",
        error: "URL não é do Mercado Livre",
      };
    }

    // Usar IA para analisar a página
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em extrair informações de produtos do Mercado Livre.
          
Sua tarefa é acessar a URL fornecida e extrair as seguintes informações:
1. Preço atual (em reais, apenas número)
2. Preço original se houver desconto (em reais, apenas número)
3. Percentual de desconto (apenas número, ex: 15)
4. Disponibilidade (true/false)
5. Descrição breve do produto

Retorne SEMPRE em formato JSON válido, mesmo que não consiga acessar a página.
Se não conseguir acessar, retorne com valores null e um campo "error" explicando o motivo.

Exemplo de resposta:
{
  "price": 189.90,
  "originalPrice": 299.90,
  "discount": 37,
  "available": true,
  "description": "Bicicleta Equilíbrio Sem Pedal",
  "error": null
}`,
        },
        {
          role: "user",
          content: `Por favor, acesse esta URL do Mercado Livre e extraia as informações de preço:
${url}

Retorne APENAS o JSON, sem explicações adicionais.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "mercadolivre_price",
          strict: true,
          schema: {
            type: "object",
            properties: {
              price: {
                type: ["number", "null"],
                description: "Preço atual em reais",
              },
              originalPrice: {
                type: ["number", "null"],
                description: "Preço original se em promoção",
              },
              discount: {
                type: ["integer", "null"],
                description: "Percentual de desconto",
              },
              available: {
                type: "boolean",
                description: "Se o produto está disponível",
              },
              description: {
                type: ["string", "null"],
                description: "Descrição breve do produto",
              },
              error: {
                type: ["string", "null"],
                description: "Mensagem de erro se houver",
              },
            },
            required: [
              "price",
              "originalPrice",
              "discount",
              "available",
              "description",
              "error",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    // Extrair resposta da IA
    const content = response.choices[0].message.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);

      return {
        price: parsed.price,
        originalPrice: parsed.originalPrice,
        discount: parsed.discount,
        available: parsed.available,
        currency: "BRL",
        description: parsed.description,
        error: parsed.error,
      };
    }

    return {
      price: null,
      originalPrice: null,
      discount: null,
      available: false,
      currency: "BRL",
      error: "Erro ao processar resposta da IA",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao extrair preço com IA:", errorMessage);

    return {
      price: null,
      originalPrice: null,
      discount: null,
      available: false,
      currency: "BRL",
      error: `Erro na consulta: ${errorMessage}`,
    };
  }
}
