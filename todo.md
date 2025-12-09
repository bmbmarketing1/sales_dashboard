# Sales Dashboard - TODO

## Funcionalidades Principais

- [x] Sistema de importação de planilhas XLS diárias (formato DD-MM-YYYY.xls)
- [x] Interface para upload manual de arquivos XLS com validação e feedback
- [x] Armazenamento automático de arquivos XLS no S3 para backup
- [x] Banco de dados com histórico de vendas, produtos e metas
- [x] Tela principal com lista de 19 produtos e termômetros visuais
- [x] Sistema de metas editáveis por produto e por canal
- [x] Visualização de vendas por canal dentro de cada produto
- [x] Cálculo automático de média mensal de vendas
- [x] Dashboard com gráficos de tendência mensal

## Estrutura de Dados

- [x] Tabela de produtos (19 produtos fixos)
- [x] Tabela de canais (5 canais: Amazon, Magalu, Mercado Livre, Shopee, TikTok)
- [x] Tabela de vendas diárias (produto, canal, data, quantidade)
- [x] Tabela de metas por produto
- [x] Tabela de metas por canal
- [x] Tabela de arquivos importados (backup S3)

## API Backend

- [x] Endpoint para upload e importação de arquivo XLS
- [x] Endpoint para listar produtos com vendas e metas
- [x] Endpoint para atualizar metas de produto
- [x] Endpoint para atualizar metas de canal
- [x] Endpoint para obter histórico de vendas
- [x] Endpoint para obter estatísticas mensais

## Frontend

- [x] Página principal com lista de produtos e termômetros
- [x] Componente de termômetro visual (verde/amarelo/vermelho)
- [x] Modal para upload de arquivo XLS
- [x] Modal para editar metas de produto
- [x] Modal para editar metas de canal
- [x] Dashboard com gráficos de tendência
