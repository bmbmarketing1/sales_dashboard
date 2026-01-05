# Sales Dashboard - TODO

## Nomenclatura de Marcas
- **BL** = Marca **CNM** (Utilidade Doméstica)
- **BQ** = Marca **Brinquei** (Brinquedos)

## Estrutura de Estoque
A planilha de estoque contém colunas para cada marca em cada marketplace:
- **Fulfillment (FUL)**: Estoque em warehouse do marketplace
- **Crossdocking (MIND)**: Estoque em warehouse próprio

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
- [x] Criar API para importar estoque da planilha
- [x] Adicionar botão "Estoque" na página inicial para upload
- [x] Adicionar coluna de estoque na linha de cada produto
- [x] Corrigir modal de upload de estoque (adicionar botão Enviar e feedback)
- [x] Testar e corrigir upload de estoque via navegador
- [x] Corrigir retorno de dados de estoque na API
- [x] Corrigir lógica de estoque: FULL específico por marketplace, CROSS compartilhado
- [ ] Criar página detalhada de estoque com insights
- [ ] Implementar alertas de risco (estoque vs meta)
- [ ] Implementar cálculo de dias de estoque estimado
- [ ] Implementar taxa de cobertura de meta


## Análise de Estoque - Fase 2

### Alertas de Risco
- [x] Implementar alerta de risco de meta (estoque vs meta)
- [x] Implementar alerta de dias de estoque baixo (<7 dias)
- [x] Implementar alerta de excesso de estoque (>60 dias)
- [x] Adicionar indicadores visuais (verde/amarelo/vermelho) no ProductRow

### Métricas de Estoque
- [x] Calcular dias de estoque estimado (estoque / vendas médias diárias)
- [x] Calcular taxa de cobertura de meta (% do estoque que cobre a meta)
- [x] Calcular distribuição de estoque por marketplace
- [x] Calcular giro de estoque (produtos com/sem movimento)

### Página de Análise Detalhada
- [x] Criar página de análise de estoque
- [x] Implementar filtros por categoria/marketplace
- [x] Adicionar tabela com todas as métricas
- [x] Implementar recomendações de reabastecimento

### Dashboard de Estoque por Marketplace
- [ ] Criar visualização de saúde do estoque por canal
- [ ] Mostrar distribuição de estoque vs demanda por marketplace
- [ ] Implementar comparativo de performance

### Visualizações e Gráficos
- [ ] Gráfico de estoque vs meta vs vendas reais
- [ ] Gráfico de tendência de estoque ao longo do tempo
- [ ] Gráfico de distribuição por marketplace
- [ ] Heatmap de risco de produtos

### Funcionalidades Adicionais
- [ ] Previsão de falta de estoque (quando vai acabar)
- [ ] Recomendação automática de quantidade para reabastecer
- [ ] Simulador de cenários (e se aumentar meta em 20%?)
- [ ] Histórico de variação de estoque
- [ ] Análise de sazonalidade


## Correções Urgentes

- [x] Corrigir alerta verde para mostrar informações completas (dias, distribuição, recomendação)
- [x] Implementar importação de metas por planilha (atualizar em massa)
- [x] Corrigir cálculo de média de vendas (usar dias do período, não 30 dias fixo)


## Sistema de Links de Anúncios

- [x] Criar tabela de links de anúncios no banco
- [x] Criar API para importar links via planilha (referência, marketplace, link)
- [x] Adicionar componente para exibir links ao expandir produto
- [x] Criar modal de upload de links
- [x] Testar com BL001 (arquivo de teste criado)

- [x] Adicionar API de edição de links (updateLink)
- [x] Adicionar API de exclusão de links (deleteLink)
- [x] Adicionar botões de editar/excluir no componente ProductListingLinks
- [x] Criar modal de edição de links
- [x] Implementar confirmação de exclusão

## Correção - Modal de Importação de Links

- [x] Corrigir seleção de arquivo no ListingsUpload
- [x] Testar upload de arquivo


## Formulário de Adição de Links

- [x] Criar API para adicionar novo link (create/add)
- [x] Criar componente AddListingForm
- [x] Integrar formulário no ProductListingLinks
- [x] Testar adição de links via formulário

## Correção - Interface de Adição de Links

- [x] Corrigir interface: adicionar botão "Ver Links de Anúncios" na seção expandida do produto
- [x] Permitir acesso intuitivo ao formulário de adição de links sem navegação separada
- [x] Testar fluxo completo: expandir produto → ver links → adicionar link


## Consulta de Preço da Amazon

- [ ] Criar API para consultar preço da Amazon via web scraping
- [ ] Adicionar botão "Consultar Preço" no card de links
- [ ] Exibir preço consultado no card de links
- [ ] Testar funcionalidade de consulta de preço


## Melhorias na Tabela de Marketplace

- [x] Adicionar coluna "Média X.X/dia" na linha do produto na tabela de cada marketplace


## Sistema de Alerta de Cobertura de Estoque FULL

- [x] Implementar cálculo de cobertura: (Média de vendas × dias do período) / Estoque FULL
- [x] Criar alerta visual para estoque com cobertura insuficiente
- [x] Alertar também sobre estoque excedente (quando cobertura > 100%)
- [x] Integrar alerta na tabela de marketplace
- [x] Testar lógica com exemplos reais


## Correção - Alerta Crítico de Falta de Estoque

- [x] Corrigir alerta: quando média de vendas > 0 e estoque FULL = 0, emitir alerta CRÍTICO em vermelho
- [x] Testar em produtos com vendas mas sem estoque FULL (ex: BL029, BL036)


## Sistema de 3 Níveis de Alertas por Dias de Cobertura

- [x] Implementar cálculo de dias de cobertura: Estoque FULL / Média diária de vendas
- [x] ALERTA CRÍTICO (vermelho): Estoque cobre < 30 dias
- [x] ALERTA SUFICIENTE (verde): Estoque cobre 30-60 dias
- [x] ALERTA EXCEDENTE (azul): Estoque cobre > 60 dias
- [x] Testar em múltiplos produtos e marketplaces


## Cards de Faturamento por Linha de Produto

- [x] Adicionar query de faturamento por categoria no backend
- [x] Criar componente de cards de faturamento por linha (Rodados, Brinquedos, Utilidades, Bebês)
- [x] Integrar cards na tela inicial após cards de resumo geral
- [x] Testar em múltiplos períodos (7 dias, 15 dias, 30 dias, Mês)


## Exportação de Relatório em Excel

- [x] Criar função de geração de Excel com SKU, Descrição e Média de Vendas
- [x] Adicionar endpoint de download de relatório no backend
- [x] Criar botão de exportação na interface
- [x] Testar exportação com dados reais


## Melhorias na Exportação de Excel

- [x] Adicionar colunas de estoque FULL e CROSS na planilha
- [x] Adicionar linha GERAL com totais de estoque e média geral


## Bug - Atualização de Estoque Não Funciona

- [x] Analisar planilha Estoque-05-01-2026.xls para entender o problema
- [x] Identificar por que a função de importação não está atualizando os dados
- [x] Corrigir lógica de atualização de estoque
- [x] Testar atualização com nova planilha


### Bug - Estoque Incorreto na Tela Geral (CORRIGIDO ✅)
- [x] Corrigir exibição de estoque na tela geral - deve mostrar soma de TODOS os estoques (FULL + CROSS)
- [x] Verificar função getProductSalesWithChannelsByPeriod que busca estoque
- [x] Testar exibição em múltiplos produtos
- [x] Substituir uso de marketplaceStock (vendas) por productChannelStockTypes (estoque)
- [x] Validar cálculo: soma de todos fullStock + crossStock
- [x] Remover uso de product_stock.crossdockingStock (tabela obsoleta com valor errado)
- [x] Usar apenas crossStock da tabela productChannelStockTypes
- [x] Testar em BL001: 60 FULL + 500 CROSS = 560 ✅ (CORRETO!)
