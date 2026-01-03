import xlrd from 'xlrd';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { productChannelStockTypes, products, channels } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

// Ler planilha com Python
import { execSync } from 'child_process';

const pythonScript = `
import xlrd
wb = xlrd.open_workbook('/home/ubuntu/upload/ESTOQUE30-12.xls')
ws = wb.sheet_by_index(0)

# Print headers
headers = []
for i in range(ws.ncols):
    headers.append(str(ws.cell_value(0, i)).strip())

print('HEADERS:', ','.join(headers))

# Print first 5 rows
for row_idx in range(1, min(6, ws.nrows)):
    row = []
    for col_idx in range(ws.ncols):
        row.append(str(ws.cell_value(row_idx, col_idx)))
    print('ROW:', ','.join(row))
`;

try {
  const output = execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
  console.log(output);
} catch (error) {
  console.error('Erro ao ler planilha:', error.message);
}
