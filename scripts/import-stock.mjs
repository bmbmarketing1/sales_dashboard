import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function importStock() {
  try {
    console.log('Iniciando importação de estoque...');
    
    // Ler planilha
    const workbook = XLSX.readFile('/home/ubuntu/upload/ESTOQUE30-12.xls');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Planilha lida com sucesso');
    
    // Conectar ao banco
    const connection = await mysql.createConnection(DATABASE_URL);
    console.log('Conectado ao banco de dados');
    
    // Obter headers
    const headers = data[0];
    console.log('Headers encontrados:', headers.length);
    
    // Mapear colunas
    const columnMap = {};
    headers.forEach((col, idx) => {
      const colLower = (col || '').toString().toLowerCase().trim();
      columnMap[colLower] = idx;
    });
    
    // Obter todos os produtos
    const [products] = await connection.execute('SELECT id, internalCode FROM products');
    const productMap = {};
    products.forEach(p => {
      productMap[p.internalCode] = p.id;
    });
    
    // Obter todos os canais
    const [channels] = await connection.execute('SELECT id, name FROM channels');
    const channelMap = {};
    channels.forEach(c => {
      channelMap[c.name.toLowerCase()] = c.id;
    });
    
    console.log('Produtos encontrados:', Object.keys(productMap).length);
    console.log('Canais encontrados:', Object.keys(channelMap).length);
    
    // Processar cada linha
    let imported = 0;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const productCode = row[columnMap['cód. interno']]?.toString().trim();
      
      if (!productCode || !productMap[productCode]) {
        continue;
      }
      
      const productId = productMap[productCode];
      
      // Processar cada coluna de estoque
      for (const [colName, colIdx] of Object.entries(columnMap)) {
        if (colName === 'cód. interno') continue;
        
        const stock = parseInt(row[colIdx]) || 0;
        if (stock === 0) continue;
        
        let marketplace = null;
        let isFullStock = false;
        let isCrossStock = false;
        
        // Determinar marketplace e tipo de estoque
        if (colName.includes('magalu')) {
          marketplace = 'Magalu';
          if (colName.includes('full') || colName.includes('ful')) isFullStock = true;
          if (colName.includes('cnm') || colName.includes('brin')) isCrossStock = true;
        } else if (colName.includes('ml ') || colName.includes('mercado')) {
          marketplace = 'Mercado Livre';
          if (colName.includes('full') || colName.includes('ful')) isFullStock = true;
          if (colName.includes('cnm') || colName.includes('brin')) isCrossStock = true;
        } else if (colName.includes('amazon')) {
          marketplace = 'Amazon';
          if (colName.includes('full') || colName.includes('ful')) isFullStock = true;
          if (colName.includes('cnm') || colName.includes('brq')) isCrossStock = true;
        } else if (colName.includes('tk ') || colName.includes('tiktok')) {
          marketplace = 'TikTok';
          if (colName.includes('full')) isFullStock = true;
          if (colName.includes('brin') || colName.includes('cnm')) isCrossStock = true;
        } else if (colName.includes('shopee')) {
          marketplace = 'Shopee';
          if (colName.includes('full')) isFullStock = true;
          if (colName.includes('bri') || colName.includes('cnm')) isCrossStock = true;
        }
        
        if (!marketplace || !channelMap[marketplace.toLowerCase()]) continue;
        
        const channelId = channelMap[marketplace.toLowerCase()];
        let fullStock = 0;
        let crossStock = 0;
        
        if (isFullStock) fullStock = stock;
        if (isCrossStock) crossStock = stock;
        
        // Inserir ou atualizar
        await connection.execute(
          `INSERT INTO product_channel_stock_types (productId, channelId, fullStock, crossStock)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE fullStock = VALUES(fullStock), crossStock = VALUES(crossStock)`,
          [productId, channelId, fullStock, crossStock]
        );
        
        imported++;
      }
    }
    
    await connection.end();
    console.log(`\n✅ Total importado: ${imported} registros`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

importStock();
