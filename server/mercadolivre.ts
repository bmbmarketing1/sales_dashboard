import { chromium } from 'playwright';

export interface MercadoLivrePrice {
  price: number | null;
  originalPrice: number | null;
  discount: number | null;
  available: boolean;
  currency: string;
  error?: string;
}

/**
 * Extrai o preço de um produto do Mercado Livre
 * @param url URL do anúncio do Mercado Livre
 * @returns Objeto com preço, preço original, desconto e disponibilidade
 */
export async function extractMercadoLivrePrice(url: string): Promise<MercadoLivrePrice> {
  let browser = null;
  
  try {
    // Validar URL
    if (!url || !url.includes('mercadolivre.com.br')) {
      return {
        price: null,
        originalPrice: null,
        discount: null,
        available: false,
        currency: 'BRL',
        error: 'URL inválida do Mercado Livre',
      };
    }

    // Iniciar navegador
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Adicionar headers realistas para evitar bloqueio
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Referer': 'https://www.mercadolivre.com.br/',
    });

    // Navegar para a URL com timeout
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Aguardar o carregamento do preço
    await page.waitForSelector('[class*="price"]', { timeout: 10000 }).catch(() => null);
    
    // Adicionar delay para evitar bloqueio
    await page.waitForTimeout(2000);

    // Extrair preço atual
    const priceText = await page.evaluate(() => {
      // Tentar diferentes seletores comuns do Mercado Livre
      const selectors = [
        'span[class*="price__fraction"]',
        '[class*="ui-pdp-price__part-body"]',
        '[class*="price"]',
        'span[data-testid*="price"]',
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        const elementsArray = Array.from(elements);
        for (const el of elementsArray) {
          const text = el.textContent?.trim();
          if (text && /\d/.test(text)) {
            return text;
          }
        }
      }

      return null;
    });

    // Extrair preço original (com desconto)
    const originalPriceText = await page.evaluate(() => {
      const selectors = [
        'span[class*="original-price"]',
        '[class*="ui-pdp-price__original"]',
        'del',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim();
          if (text && /\d/.test(text)) {
            return text;
          }
        }
      }

      return null;
    });

    // Extrair disponibilidade
    const available = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return !text.includes('Fora de estoque') && !text.includes('Sem estoque');
    });

    // Fechar browser
    await browser.close();

    // Parsear preços
    const parsePrice = (text: string | null): number | null => {
      if (!text) return null;
      const match = text.match(/[\d.,]+/);
      if (!match) return null;
      const cleaned = match[0].replace(/\./g, '').replace(',', '.');
      const price = parseFloat(cleaned);
      return isNaN(price) ? null : price;
    };

    const price = parsePrice(priceText);
    const originalPrice = parsePrice(originalPriceText);

    // Calcular desconto
    let discount = null;
    if (price && originalPrice && originalPrice > price) {
      discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    }

    return {
      price,
      originalPrice,
      discount,
      available,
      currency: 'BRL',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao extrair preço do Mercado Livre:', errorMessage);
    
    // Retornar erro mais específico
    return {
      price: null,
      originalPrice: null,
      discount: null,
      available: false,
      currency: 'BRL',
      error: `Erro na consulta: ${errorMessage}. Verifique se a URL está correta e se o produto está disponível.`,
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Erro ao fechar browser:', e);
      }
    }
  }
}
