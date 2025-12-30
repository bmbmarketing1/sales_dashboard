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

## Página de Detalhes do Produto

- [x] API para histórico de vendas por produto com filtro de período
- [x] Página de detalhes do produto com seletor de período
- [x] Gráfico de vendas diárias do produto por período
- [x] Tabela de vendas por marketplace com atingimento de meta
- [x] Indicador visual de dias que atingiram/não atingiram a meta

## Correções de Bugs

- [x] Corrigir timezone: data mostra 1 dia antes (ex: 01/12 mostra como 30/11)
- [x] Registrar vendas zero quando produto não aparece na planilha
- [x] Meta diária do produto = soma automática das metas por canal
- [x] Cálculo correto: meta total do período = soma metas × dias buscados

## Funcionalidade de Limpar Dados

- [x] API para limpar vendas e importações
- [x] Botão de limpar dados na interface com confirmação

## Melhorias na Página de Produto e Insights

- [x] Simplificar página de produto: manter apenas tabela detalhada
- [x] Marketplace: manter apenas termômetros (remover gráfico)
- [x] Adicionar seletor de datas específicas (além de períodos)
- [x] Nova aba Insights: produtos batendo meta vs não batendo

## Bug de Timezone (Correção Urgente)

- [x] Corrigir timezone em todas as funções: usar horário de São Paulo (UTC-3)
- [x] Data 01/12 está mostrando como 30/11 - corrigir conversão

## Melhorias na Página Principal

- [x] Seletor de período: 7 dias, 15 dias, 30 dias, mês atual
- [x] Seletor de datas específicas: data início e data fim
- [x] Barra de pesquisa para filtrar produtos por nome/código
- [x] Cards de resumo com totais do período (vendas, meta, atingimento)
- [x] Produtos com vendas e metas calculadas para o período selecionado

## Bug de Meta por Canal

- [x] Corrigir meta por canal: deve ser multiplicada pelo período selecionado
- [x] Inicializar metas padrão para todos os produtos/canais

## Melhorias de Layout e UX

- [x] Editar metas por marketplace: botão único "Salvar Todas" para atualizar todas as metas
- [x] Menu de período: adicionar opção "1 dia" (ontem)
- [x] Layout do dashboard: mudar de cards para linhas
- [x] Sequência das colunas: Referência | Nome | Meta + Termômetro | Botões navegação | Ver por canal

## Correções e Novas Funcionalidades

- [x] Bug: Atualização de metas por marketplace não está funcionando (adicionado unique constraint)
- [x] Adicionar ordenação de produtos por desempenho (melhor → pior)

## Funcionalidade de Categorias

- [x] Adicionar campo categoria na tabela de produtos
- [x] Criar API para importar categorias da planilha XLS
- [x] Adicionar botão de importar categorias no menu
- [x] Adicionar filtro por categoria no dashboard

## Funcionalidade de Importar Novos Produtos

- [x] Criar API para importar novos produtos da planilha (Cód. ID, Cód. Interno, Descrição)
- [x] Adicionar botão de importar produtos no menu
- [x] Inicializar metas padrão para novos produtos em todos os canais

## Alterações no Dashboard

- [x] Remover aba "Gráfico Mensal"
- [x] Criar página de visão por marketplace
- [x] Adicionar botão/filtro para acessar visão de cada marketplace

## Melhorias na Página de Marketplace e Modelos de Planilha

- [x] Adicionar gráfico de 30 dias na página de marketplace ao clicar em "Ver detalhes"
- [x] Adicionar modelo de planilha para download no botão de Categorias
- [x] Adicionar modelo de planilha para download no botão de Importar Planilha

## Faturamento e Melhorias

- [x] Adicionar campo faturamento na tabela de vendas
- [x] Atualizar importação para ler coluna Faturamento da planilha
- [x] Adicionar contador de SKUs com vendas na página inicial (ex: 15/19 SKUs)
- [x] Adicionar card de Faturamento do Período na página inicial
- [x] Adicionar card de Ticket Médio na página inicial
- [x] Adicionar faturamento individual na linha de cada produto
- [x] Remover modal de detalhes da página de marketplace
- [x] Distribuir faturamento proporcionalmente entre canais com vendas

## Melhorias Solicitadas - Dezembro 2025

- [x] Adicionar filtro por categoria na aba Insights
- [x] Restaurar modal de histórico na página de marketplace
- [x] Juntar card de Atingimento com Meta do Período (similar ao SKUs com Vendas)
- [x] Ajustar formatação do faturamento para suportar valores acima de R$ 100.000.000,00 (mil, mi, bi)

## Imagens de Produtos

- [x] Analisar formato da planilha de imagens
- [x] Adicionar campo imageUrl na tabela de produtos
- [x] Criar API para importar URLs de imagens da planilha
- [x] Criar botão "Fotos" na página inicial para upload da planilha
- [x] Exibir imagem do produto na página de detalhes

## Correção de Erros - removeChild

- [x] Corrigir erro de removeChild nas abas de Categoria, Marketplace e Produtos
- [x] Testar todas as páginas após correção

## Melhorias de UX - Janeiro 2026

- [x] Adicionar média de vendas por período na linha de cada produto (ex: "Média 12/dia")
- [x] Adicionar botão "X" para deletar planilhas individualmente na aba Importações


## Correção - Delete de Planilhas

- [x] Implementar função de delete no banco de dados (deletar arquivo e vendas associadas)
- [x] Implementar mutation de delete no backend (routers.ts)
- [x] Testar funcionalidade de delete na interface


## Sistema de Estoque

- [x] Analisar planilha de estoque e entender estrutura (BL vs BQ)
- [x] Criar tabelas de estoque no banco de dados (crossdocking e fulfillment)
- [x] Criar API para importar estoque da planilha (em progresso)
- [x] Adicionar botão "Estoque" na página inicial para upload
- [x] Adicionar coluna de estoque na linha de cada produto
- [ ] Criar página detalhada de estoque com insights
- [ ] Implementar alertas de risco (estoque vs meta)
- [ ] Implementar cálculo de dias de estoque estimado
- [ ] Implementar taxa de cobertura de meta
- [ ] Testar funcionalidade completa
