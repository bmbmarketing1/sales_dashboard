import { eq, and, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { format } from "date-fns";
import { 
  InsertUser, users, 
  products, InsertProduct, Product,
  channels, InsertChannel, Channel,
  dailySales, InsertDailySale, DailySale,
  productChannelGoals, InsertProductChannelGoal,
  importedFiles, InsertImportedFile,
  productStock, InsertProductStock, ProductStock,
  marketplaceStock, InsertMarketplaceStock, MarketplaceStock,
  productListingLinks, InsertProductListingLink, ProductListingLink,
  productChannelStockTypes, InsertProductChannelStockType, ProductChannelStockType
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ PRODUCT FUNCTIONS ============

const FIXED_PRODUCTS = [
  { externalId: 12916, internalCode: "BQ061", description: "COZINHA INFANTIL MODERNA 43 PCS" },
  { externalId: 12904, internalCode: "BQ062", description: "COZINHA INFANTIL MINI CHEF" },
  { externalId: 12912, internalCode: "BQ063", description: "BRINQ PISTA DE BOLINHAS 91PCS" },
  { externalId: 12913, internalCode: "BQ064", description: "BRINQ PISTA DE BOLINHAS 105 PCS" },
  { externalId: 12914, internalCode: "BQ066", description: "MARKET PINK" },
  { externalId: 12908, internalCode: "BQ067", description: "MARKET AZUL" },
  { externalId: 12911, internalCode: "BQ068", description: "MESA DE BLOCOS AZUL" },
  { externalId: 12910, internalCode: "BQ069", description: "MESA DE BLOCOS ROSA" },
  { externalId: 12922, internalCode: "BQ071", description: "MESA COM CADEIRA DIBLOCOS 89PCS ROSA" },
  { externalId: 12903, internalCode: "BQ073", description: "MINI MESINHA BRINQ BLOCOS VERDE 100 PCS" },
  { externalId: 12902, internalCode: "BQ074", description: "MINI MESINHA BRINQ BLOCOS ROSA 100 PCS" },
  { externalId: 12918, internalCode: "BQ076", description: "BRINQUEDO ARCO E FLECHA VERDE" },
  { externalId: 12917, internalCode: "BQ077", description: "BRINQUEDO ARCO E FLECHA ROSA" },
  { externalId: 12923, internalCode: "BQ078", description: "CHUTE A GOL SIMPLES" },
  { externalId: 12921, internalCode: "BQ079", description: "MINI BATERIA VERMELHA" },
  { externalId: 12926, internalCode: "BQ086", description: "MINI BATERIA AZUL" },
  { externalId: 12907, internalCode: "BQ093", description: "MALETA DE FERRAMENTAS" },
  { externalId: 12906, internalCode: "BQ095", description: "MALETA COZINHA INFANTIL" },
  { externalId: 12929, internalCode: "BQ097", description: "TENDA BRINQ BRILHA 2" },
];

const FIXED_CHANNELS = ["Amazon", "Magalu", "Mercado Livre", "Shopee", "TikTok"];

export async function seedProducts(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const product of FIXED_PRODUCTS) {
    await db.insert(products).values({
      externalId: product.externalId,
      internalCode: product.internalCode,
      description: product.description,
      dailyGoal: 5, // Default goal
    }).onDuplicateKeyUpdate({
      set: { description: product.description },
    });
  }
}

export async function seedChannels(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const channelName of FIXED_CHANNELS) {
    await db.insert(channels).values({
      name: channelName,
      dailyGoal: 10, // Default goal
    }).onDuplicateKeyUpdate({
      set: { name: channelName },
    });
  }
}

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(products.internalCode);
}

export async function upsertProduct(externalId: number, internalCode: string, description: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Insert or update product
  await db.insert(products).values({
    externalId,
    internalCode,
    description,
    dailyGoal: 5, // Default goal
  }).onDuplicateKeyUpdate({
    set: { description },
  });
  
  // Get the product ID
  const result = await db.select({ id: products.id })
    .from(products)
    .where(eq(products.internalCode, internalCode))
    .limit(1);
  
  return result[0]?.id ?? null;
}

export async function initializeProductChannelGoalsForProduct(productId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const allChannels = await getAllChannels();
  
  for (const channel of allChannels) {
    // Check if goal already exists
    const existing = await db.select()
      .from(productChannelGoals)
      .where(sql`${productChannelGoals.productId} = ${productId} AND ${productChannelGoals.channelId} = ${channel.id}`)
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(productChannelGoals).values({
        productId,
        channelId: channel.id,
        dailyGoal: 2, // Default goal per channel
      });
    }
  }
}

export async function updateProductCategory(internalCode: string, category: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(products)
    .set({ category })
    .where(eq(products.internalCode, internalCode));
}

export async function updateProductImage(internalCode: string, imageUrl: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.update(products)
    .set({ imageUrl })
    .where(eq(products.internalCode, internalCode));
  
  return true;
}

export async function getProductByInternalCode(internalCode: string): Promise<Product | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(products)
    .where(eq(products.internalCode, internalCode))
    .limit(1);
  
  return result[0] || null;
}

export async function getUniqueCategories(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.selectDistinct({ category: products.category })
    .from(products)
    .where(sql`${products.category} IS NOT NULL AND ${products.category} != ''`);
  
  return result.map(r => r.category).filter((c): c is string => c !== null);
}

export async function getAllChannels(): Promise<Channel[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(channels).orderBy(channels.name);
}

export async function updateProductGoal(productId: number, dailyGoal: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set({ dailyGoal }).where(eq(products.id, productId));
}

export async function updateChannelGoal(channelId: number, dailyGoal: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(channels).set({ dailyGoal }).where(eq(channels.id, channelId));
}

// ============ PRODUCT-CHANNEL GOALS ============

export async function getProductChannelGoal(productId: number, channelId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select()
    .from(productChannelGoals)
    .where(and(
      eq(productChannelGoals.productId, productId),
      eq(productChannelGoals.channelId, channelId)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0].dailyGoal : 0;
}

export async function upsertProductChannelGoal(productId: number, channelId: number, dailyGoal: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(productChannelGoals).values({
    productId,
    channelId,
    dailyGoal,
  }).onDuplicateKeyUpdate({
    set: { dailyGoal },
  });
}

export async function getAllProductChannelGoals() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productChannelGoals);
}

// ============ DAILY SALES ============

export async function upsertDailySale(productId: number, channelId: number, saleDate: string, quantity: number, revenue: number = 0): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Check if record exists - use string comparison for date
  const existing = await db.select()
    .from(dailySales)
    .where(sql`${dailySales.productId} = ${productId} AND ${dailySales.channelId} = ${channelId} AND DATE(${dailySales.saleDate}) = ${saleDate}`)
    .limit(1);
  
  if (existing.length > 0) {
    // Update quantity and add revenue to existing (in case revenue comes from different channel)
    const newRevenue = (existing[0].revenue || 0) + revenue;
    await db.update(dailySales)
      .set({ quantity, revenue: newRevenue })
      .where(eq(dailySales.id, existing[0].id));
  } else {
    // Use SQL date string directly to avoid timezone issues
    await db.execute(sql`INSERT INTO daily_sales (productId, channelId, saleDate, quantity, revenue) VALUES (${productId}, ${channelId}, ${saleDate}, ${quantity}, ${revenue})`);
  }
}

export async function getDailySalesByDate(saleDate: string): Promise<DailySale[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailySales).where(sql`${dailySales.saleDate} = ${saleDate}`);
}

export async function getSalesForMonth(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  
  return db.select()
    .from(dailySales)
    .where(sql`${dailySales.saleDate} >= ${startDate} AND ${dailySales.saleDate} <= ${endDate}`);
}

export async function getProductSalesWithChannels(saleDate: string) {
  const db = await getDb();
  if (!db) return [];
  
  const allProducts = await getAllProducts();
  const allChannels = await getAllChannels();
  const sales = await getDailySalesByDate(saleDate);
  const goals = await getAllProductChannelGoals();
  
  return allProducts.map(product => {
    const channelSales = allChannels.map(channel => {
      const sale = sales.find(s => s.productId === product.id && s.channelId === channel.id);
      const goal = goals.find(g => g.productId === product.id && g.channelId === channel.id);
      return {
        channelId: channel.id,
        channelName: channel.name,
        quantity: sale?.quantity || 0,
        channelGoal: goal?.dailyGoal || 0,
      };
    });
    
    const totalSales = channelSales.reduce((sum, cs) => sum + cs.quantity, 0);
    
    // Calculate daily goal as sum of channel goals
    const calculatedDailyGoal = channelSales.reduce((sum, cs) => sum + cs.channelGoal, 0);
    
    return {
      ...product,
      // Use calculated goal from channels, fallback to product.dailyGoal if no channel goals set
      dailyGoal: calculatedDailyGoal > 0 ? calculatedDailyGoal : product.dailyGoal,
      totalSales,
      channelSales,
    };
  });
}

// ============ SALES BY PERIOD ============

export async function getProductSalesWithChannelsByPeriod(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return { products: [], daysInPeriod: 0 };
  
  const allProducts = await getAllProducts();
  const allChannels = await getAllChannels();
  const goals = await getAllProductChannelGoals();
  
  // Calculate days in period
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Get all sales in the date range
  const sales = await db.select()
    .from(dailySales)
    .where(sql`${dailySales.saleDate} >= ${startDate} AND ${dailySales.saleDate} <= ${endDate}`);
  
  // Get all stock info
  const allStocks = await db.select().from(productStock);
  const allMarketplaceStocks = await db.select().from(marketplaceStock);
  
  const products = allProducts.map(product => {
    const channelSales = allChannels.map(channel => {
      // Sum all sales for this product/channel in the period
      const productChannelSales = sales.filter(s => s.productId === product.id && s.channelId === channel.id);
      const channelTotal = productChannelSales.reduce((sum, s) => sum + s.quantity, 0);
      const channelRevenue = productChannelSales.reduce((sum, s) => sum + (s.revenue || 0), 0);
      
      const goal = goals.find(g => g.productId === product.id && g.channelId === channel.id);
      const dailyGoal = goal?.dailyGoal || 0;
      
      return {
        channelId: channel.id,
        channelName: channel.name,
        quantity: channelTotal,
        revenue: channelRevenue,
        channelGoal: dailyGoal,
        periodGoal: dailyGoal * daysInPeriod,
      };
    });
    
    const totalSales = channelSales.reduce((sum, cs) => sum + cs.quantity, 0);
    const totalRevenue = channelSales.reduce((sum, cs) => sum + cs.revenue, 0);
    
    // Calculate daily goal as sum of channel goals
    const calculatedDailyGoal = channelSales.reduce((sum, cs) => sum + cs.channelGoal, 0);
    const effectiveDailyGoal = calculatedDailyGoal > 0 ? calculatedDailyGoal : product.dailyGoal;
    const periodGoal = effectiveDailyGoal * daysInPeriod;
    
    // Get stock info
    const stock = allStocks.find(s => s.productId === product.id);
    const crossdockingStock = stock?.crossdockingStock || 0;
    const totalStock = crossdockingStock + (allMarketplaceStocks
      .filter(ms => ms.productId === product.id)
      .reduce((sum, ms) => sum + ms.stock, 0) || 0);
    
    // Calculate stock metrics
    const avgSalesPerDay = totalSales / daysInPeriod;
    const daysOfStockAvailable = avgSalesPerDay > 0 ? Math.round(totalStock / avgSalesPerDay) : 0;
    const stockCoveragePercentage = periodGoal > 0 ? Math.round((totalStock / periodGoal) * 100) : 0;
    
    // Determine risk level
    let riskLevel: 'green' | 'yellow' | 'red' = 'green';
    if (stockCoveragePercentage < 50) {
      riskLevel = 'red';
    } else if (stockCoveragePercentage < 100) {
      riskLevel = 'yellow';
    }
    
    // Calculate marketplace distribution
    const productMarketplaceStocks = allMarketplaceStocks.filter(ms => ms.productId === product.id);
    const marketplaceDistribution = allChannels.map(channel => {
      const channelStock = productMarketplaceStocks.find(ms => ms.channelId === channel.id);
      const stock = channelStock?.stock || 0;
      const percentage = totalStock > 0 ? Math.round((stock / totalStock) * 100) : 0;
      return {
        channelId: channel.id,
        channelName: channel.name,
        stock,
        percentage,
      };
    }).filter(d => d.stock > 0);
    
    // Calculate recommended restocking (30 days of coverage)
    const dailyGoal = periodGoal / daysInPeriod;
    const reabastecimentoRecomendado = Math.max(0, Math.ceil(dailyGoal * 30 - totalStock));
    
    // Calculate forecast of stock depletion
    const previsaoFaltaEstoque = avgSalesPerDay > 0 && totalStock > 0 ? Math.round(totalStock / avgSalesPerDay) : null;
    
    return {
      ...product,
      dailyGoal: effectiveDailyGoal,
      periodGoal,
      totalSales,
      totalRevenue,
      avgSalesPerDay: Math.round(avgSalesPerDay * 100) / 100,
      channelSales,
      crossdockingStock,
      totalStock,
      daysOfStockAvailable,
      stockCoveragePercentage,
      riskLevel,
      marketplaceDistribution,
      reabastecimentoRecomendado,
      previsaoFaltaEstoque,
    };
  });
  
  return { products, daysInPeriod };
}

// ============ MONTHLY STATS ============

export async function getMonthlyAverages(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  
  const result = await db.select({
    productId: dailySales.productId,
    totalQuantity: sql<number>`SUM(${dailySales.quantity})`,
    daysWithSales: sql<number>`COUNT(DISTINCT ${dailySales.saleDate})`,
  })
    .from(dailySales)
    .where(sql`${dailySales.saleDate} >= ${startDate} AND ${dailySales.saleDate} <= ${endDate}`)
    .groupBy(dailySales.productId);
  
  return result;
}

export async function getDailyTotals(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  
  const result = await db.select({
    saleDate: dailySales.saleDate,
    totalQuantity: sql<number>`SUM(${dailySales.quantity})`,
  })
    .from(dailySales)
    .where(sql`${dailySales.saleDate} >= ${startDate} AND ${dailySales.saleDate} <= ${endDate}`)
    .groupBy(dailySales.saleDate)
    .orderBy(dailySales.saleDate);
  
  // Adjust dates for Brazil timezone (UTC-3)
  return result.map(r => {
    let adjustedDate = r.saleDate;
    if (r.saleDate instanceof Date) {
      adjustedDate = new Date(r.saleDate.getTime() + (3 * 60 * 60 * 1000));
    }
    return {
      ...r,
      saleDate: adjustedDate,
    };
  });
}

// ============ IMPORTED FILES ============

export async function logImportedFile(file: InsertImportedFile): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(importedFiles).values(file);
}

export async function getImportedFiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(importedFiles).orderBy(desc(importedFiles.importedAt));
}

export async function isFileAlreadyImported(fileDate: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select()
    .from(importedFiles)
    .where(sql`${importedFiles.fileDate} = ${fileDate}`)
    .limit(1);
  
  return result.length > 0;
}

export async function deleteImportedFile(fileId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    const file = await db.select()
      .from(importedFiles)
      .where(eq(importedFiles.id, fileId))
      .limit(1);
    
    if (file.length === 0) return false;
    
    const fileDate = format(file[0].fileDate, "yyyy-MM-dd");
    
    await db.delete(dailySales)
      .where(sql`DATE(${dailySales.saleDate}) = ${fileDate}`);
    
    await db.delete(importedFiles)
      .where(eq(importedFiles.id, fileId));
    
    return true;
  } catch (error) {
    console.error("Error deleting imported file:", error);
    return false;
  }
}

export async function clearAllSalesData(): Promise<{ salesDeleted: number; importsDeleted: number }> {
  const db = await getDb();
  if (!db) return { salesDeleted: 0, importsDeleted: 0 };
  
  // Count records before deletion
  const salesCount = await db.select({ count: sql<number>`COUNT(*)` }).from(dailySales);
  const importsCount = await db.select({ count: sql<number>`COUNT(*)` }).from(importedFiles);
  
  // Delete all sales records
  await db.delete(dailySales);
  
  // Delete all import records
  await db.delete(importedFiles);
  
  return {
    salesDeleted: Number(salesCount[0]?.count || 0),
    importsDeleted: Number(importsCount[0]?.count || 0),
  };
}

// ============ INSIGHTS ============

export async function getProductsInsights(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return { meetingGoal: [], notMeetingGoal: [] };
  
  const allProducts = await getAllProducts();
  const allChannels = await getAllChannels();
  const goals = await getAllProductChannelGoals();
  
  // Get all sales in the date range
  const sales = await db.select()
    .from(dailySales)
    .where(sql`${dailySales.saleDate} >= ${startDate} AND ${dailySales.saleDate} <= ${endDate}`);
  
  // Group sales by product
  const salesByProduct = new Map<number, number>();
  const daysByProduct = new Map<number, Set<string>>();
  
  for (const sale of sales) {
    const current = salesByProduct.get(sale.productId) || 0;
    salesByProduct.set(sale.productId, current + sale.quantity);
    
    const days = daysByProduct.get(sale.productId) || new Set();
    const dateStr = sale.saleDate instanceof Date 
      ? sale.saleDate.toISOString().split('T')[0]
      : String(sale.saleDate);
    days.add(dateStr);
    daysByProduct.set(sale.productId, days);
  }
  
  // Calculate days in period
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const meetingGoal: Array<{
    productId: number;
    internalCode: string;
    description: string;
    category: string | null;
    totalSales: number;
    totalGoal: number;
    percentage: number;
    dailyGoal: number;
  }> = [];
  
  const notMeetingGoal: typeof meetingGoal = [];
  
  for (const product of allProducts) {
    // Calculate daily goal from channel goals
    let dailyGoal = 0;
    for (const channel of allChannels) {
      const goal = goals.find(g => g.productId === product.id && g.channelId === channel.id);
      dailyGoal += goal?.dailyGoal || channel.dailyGoal;
    }
    if (dailyGoal === 0) dailyGoal = product.dailyGoal;
    
    const totalSales = salesByProduct.get(product.id) || 0;
    const totalGoal = dailyGoal * daysInPeriod;
    const percentage = totalGoal > 0 ? Math.round((totalSales / totalGoal) * 100) : 0;
    
    const productData = {
      productId: product.id,
      internalCode: product.internalCode,
      description: product.description,
      category: product.category,
      totalSales,
      totalGoal,
      percentage,
      dailyGoal,
    };
    
    if (percentage >= 100) {
      meetingGoal.push(productData);
    } else {
      notMeetingGoal.push(productData);
    }
  }
  
  // Sort by percentage descending
  meetingGoal.sort((a, b) => b.percentage - a.percentage);
  notMeetingGoal.sort((a, b) => b.percentage - a.percentage);
  
  return { meetingGoal, notMeetingGoal, daysInPeriod };
}

// ============ MARKETPLACE VIEW ============

export async function getSalesByMarketplace(channelId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return { channel: null, products: [], daysInPeriod: 0 };
  
  const allProducts = await getAllProducts();
  const allChannels = await getAllChannels();
  const goals = await getAllProductChannelGoals();
  
  // Get stock data for this channel
  const stockData = await db.select()
    .from(productChannelStockTypes)
    .where(sql`${productChannelStockTypes.channelId} = ${channelId}`);
  
  const channel = allChannels.find(c => c.id === channelId);
  if (!channel) return { channel: null, products: [], daysInPeriod: 0 };
  
  // Calculate days in period
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Get all sales for this channel in the date range
  const sales = await db.select()
    .from(dailySales)
    .where(sql`${dailySales.channelId} = ${channelId} AND ${dailySales.saleDate} >= ${startDate} AND ${dailySales.saleDate} <= ${endDate}`);
  
  // Aggregate sales by product
  const salesByProduct = new Map<number, number>();
  for (const sale of sales) {
    const current = salesByProduct.get(sale.productId) || 0;
    salesByProduct.set(sale.productId, current + sale.quantity);
  }
  
  const products = allProducts.map(product => {
    const goal = goals.find(g => g.productId === product.id && g.channelId === channelId);
    const dailyGoal = goal?.dailyGoal || 0;
    const periodGoal = dailyGoal * daysInPeriod;
    const totalSales = salesByProduct.get(product.id) || 0;
    const percentage = periodGoal > 0 ? Math.round((totalSales / periodGoal) * 100) : 0;
    
    // Calculate average daily sales for the period
    const averageDailySales = daysInPeriod > 0 ? totalSales / daysInPeriod : 0;
    
    // Get stock coverage data
    const stock = stockData.find(s => s.productId === product.id);
    const fullStock = stock?.fullStock || 0;
    const stockNeeded = averageDailySales * daysInPeriod;
    const stockCoverage = fullStock > 0 ? Math.round((stockNeeded / fullStock) * 100) : 0;
    const stockExcess = Math.max(0, fullStock - stockNeeded);
    const stockDeficit = Math.max(0, stockNeeded - fullStock);
    
    return {
      id: product.id,
      externalId: product.externalId,
      internalCode: product.internalCode,
      description: product.description,
      category: product.category,
      dailyGoal,
      periodGoal,
      totalSales,
      percentage,
      averageDailySales: Math.round(averageDailySales * 10) / 10,
      fullStock,
      stockCoverage,
      stockExcess: Math.round(stockExcess),
      stockDeficit: Math.round(stockDeficit),
    };
  });

  // Calculate channel totals
  const totalSales = products.reduce((sum, p) => sum + p.totalSales, 0);
  const totalGoal = products.reduce((sum, p) => sum + p.periodGoal, 0);
  const overallPercentage = totalGoal > 0 ? Math.round((totalSales / totalGoal) * 100) : 0;
  
  return {
    channel: {
      ...channel,
      totalSales,
      totalGoal,
      overallPercentage,
    },
    products,
    daysInPeriod,
  };
}

// ============ INITIALIZATION ============

export async function initializeDatabase(): Promise<void> {
  await seedProducts();
  await seedChannels();
  await seedProductChannelGoals();
}

// Seed default product-channel goals if they don't exist
export async function seedProductChannelGoals(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const allProducts = await getAllProducts();
  const allChannels = await getAllChannels();
  const existingGoals = await getAllProductChannelGoals();
  
  // Create a set of existing product-channel combinations
  const existingKeys = new Set(existingGoals.map(g => `${g.productId}-${g.channelId}`));
  
  // Default goal per channel (will sum to product's dailyGoal)
  const defaultGoalPerChannel = 2;
  
  for (const product of allProducts) {
    for (const channel of allChannels) {
      const key = `${product.id}-${channel.id}`;
      if (!existingKeys.has(key)) {
        await db.insert(productChannelGoals).values({
          productId: product.id,
          channelId: channel.id,
          dailyGoal: defaultGoalPerChannel,
        }).onDuplicateKeyUpdate({
          set: { dailyGoal: defaultGoalPerChannel },
        });
      }
    }
  }
}


// ============ PRODUCT DETAIL HISTORY ============

export async function getProductById(productId: number): Promise<Product | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getProductSalesHistory(productId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  
  const allChannels = await getAllChannels();
  const goals = await getAllProductChannelGoals();
  const product = await getProductById(productId);
  
  if (!product) return [];
  
  // Get all sales for this product in the date range
  const sales = await db.select()
    .from(dailySales)
    .where(sql`${dailySales.productId} = ${productId} AND ${dailySales.saleDate} >= ${startDate} AND ${dailySales.saleDate} <= ${endDate}`)
    .orderBy(dailySales.saleDate);
  
  // Group sales by date
  const salesByDate: Record<string, { channelId: number; quantity: number }[]> = {};
  
  sales.forEach(sale => {
    // Handle date properly - use Brazil timezone (UTC-3)
    let dateStr: string;
    if (sale.saleDate instanceof Date) {
      // Add 3 hours to compensate for Brazil timezone (UTC-3)
      // MySQL DATE is stored as UTC midnight, which becomes previous day in Brazil
      const adjustedDate = new Date(sale.saleDate.getTime() + (3 * 60 * 60 * 1000));
      const year = adjustedDate.getFullYear();
      const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
      const day = String(adjustedDate.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else {
      dateStr = String(sale.saleDate);
    }
    
    if (!salesByDate[dateStr]) {
      salesByDate[dateStr] = [];
    }
    salesByDate[dateStr].push({
      channelId: sale.channelId,
      quantity: sale.quantity,
    });
  });
  
  // Calculate daily goal as sum of channel goals
  const calculatedDailyGoal = allChannels.reduce((sum, channel) => {
    const goal = goals.find(g => g.productId === productId && g.channelId === channel.id);
    return sum + (goal?.dailyGoal || 0);
  }, 0);
  
  // Use calculated goal from channels, fallback to product.dailyGoal if no channel goals set
  const effectiveDailyGoal = calculatedDailyGoal > 0 ? calculatedDailyGoal : product.dailyGoal;
  
  // Build result with all dates that have sales
  const result = Object.entries(salesByDate).map(([date, channelSales]) => {
    const channelData = allChannels.map(channel => {
      const sale = channelSales.find(s => s.channelId === channel.id);
      const goal = goals.find(g => g.productId === productId && g.channelId === channel.id);
      return {
        channelId: channel.id,
        channelName: channel.name,
        quantity: sale?.quantity || 0,
        channelGoal: goal?.dailyGoal || 0,
      };
    });
    
    const totalSales = channelData.reduce((sum, cs) => sum + cs.quantity, 0);
    const metGoal = totalSales >= effectiveDailyGoal;
    
    return {
      date,
      totalSales,
      dailyGoal: effectiveDailyGoal,
      metGoal,
      percentage: effectiveDailyGoal > 0 ? Math.round((totalSales / effectiveDailyGoal) * 100) : 0,
      channelSales: channelData,
    };
  });
  
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getProductChannelSummary(productId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  
  const allChannels = await getAllChannels();
  const goals = await getAllProductChannelGoals();
  
  // Get total sales per channel for this product in the date range
  const result = await db.select({
    channelId: dailySales.channelId,
    totalQuantity: sql<number>`SUM(${dailySales.quantity})`,
    daysWithSales: sql<number>`COUNT(DISTINCT ${dailySales.saleDate})`,
  })
    .from(dailySales)
    .where(sql`${dailySales.productId} = ${productId} AND ${dailySales.saleDate} >= ${startDate} AND ${dailySales.saleDate} <= ${endDate}`)
    .groupBy(dailySales.channelId);
  
  return allChannels.map(channel => {
    const channelData = result.find(r => r.channelId === channel.id);
    const goal = goals.find(g => g.productId === productId && g.channelId === channel.id);
    
    return {
      channelId: channel.id,
      channelName: channel.name,
      totalSales: channelData?.totalQuantity || 0,
      daysWithSales: channelData?.daysWithSales || 0,
      dailyGoal: goal?.dailyGoal || 0,
    };
  });
}


// ============ PRODUCT CHANNEL HISTORY ============

export async function getProductChannelHistory(productId: number, channelId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  // Get goal for this product/channel
  const goals = await getAllProductChannelGoals();
  const goal = goals.find(g => g.productId === productId && g.channelId === channelId);
  const dailyGoal = goal?.dailyGoal || 0;
  
  // Get product info
  const allProducts = await getAllProducts();
  const product = allProducts.find(p => p.id === productId);
  
  // Get channel info
  const allChannels = await getAllChannels();
  const channel = allChannels.find(c => c.id === channelId);
  
  // Calculate date range (last N days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  // Get sales data
  const salesData = await db.select({
    saleDate: dailySales.saleDate,
    quantity: dailySales.quantity,
  })
    .from(dailySales)
    .where(sql`${dailySales.productId} = ${productId} AND ${dailySales.channelId} = ${channelId} AND ${dailySales.saleDate} >= ${startDateStr} AND ${dailySales.saleDate} <= ${endDateStr}`)
    .orderBy(dailySales.saleDate);
  
  // Create a map of date -> quantity
  const salesMap = new Map<string, number>();
  salesData.forEach(sale => {
    const dateStr = sale.saleDate instanceof Date 
      ? sale.saleDate.toISOString().split('T')[0]
      : String(sale.saleDate).split('T')[0];
    salesMap.set(dateStr, sale.quantity);
  });
  
  // Generate all dates in range
  const result = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const quantity = salesMap.get(dateStr) || 0;
    
    result.push({
      date: dateStr,
      quantity,
      goal: dailyGoal,
      percentage: dailyGoal > 0 ? Math.round((quantity / dailyGoal) * 100) : 0,
      metGoal: quantity >= dailyGoal,
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    product: product ? { id: product.id, internalCode: product.internalCode, description: product.description } : null,
    channel: channel ? { id: channel.id, name: channel.name } : null,
    dailyGoal,
    history: result,
    totalSales: result.reduce((sum, r) => sum + r.quantity, 0),
    totalGoal: dailyGoal * days,
  };
}


// ============ STOCK FUNCTIONS ============

export async function upsertProductStock(productId: number, crossdockingStock: number, lastUpdated: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select()
    .from(productStock)
    .where(eq(productStock.productId, productId))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(productStock)
      .set({ crossdockingStock, lastUpdated })
      .where(eq(productStock.productId, productId));
  } else {
    await db.insert(productStock).values({
      productId,
      crossdockingStock,
      lastUpdated,
    });
  }
}

export async function upsertMarketplaceStock(productId: number, channelId: number, stock: number, lastUpdated: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select()
    .from(marketplaceStock)
    .where(and(eq(marketplaceStock.productId, productId), eq(marketplaceStock.channelId, channelId)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(marketplaceStock)
      .set({ stock, lastUpdated })
      .where(and(eq(marketplaceStock.productId, productId), eq(marketplaceStock.channelId, channelId)));
  } else {
    await db.insert(marketplaceStock).values({
      productId,
      channelId,
      stock,
      lastUpdated,
    });
  }
}

export async function getProductStockInfo(productId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const stock = await db.select()
    .from(productStock)
    .where(eq(productStock.productId, productId))
    .limit(1);
  
  if (stock.length === 0) return null;
  
  const marketplaceStocks = await db.select()
    .from(marketplaceStock)
    .where(eq(marketplaceStock.productId, productId));
  
  return {
    crossdocking: stock[0],
    marketplaces: marketplaceStocks,
  };
}

export async function getAllProductsWithStock(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  
  const allProducts = await getAllProducts();
  const allChannels = await getAllChannels();
  const goals = await getAllProductChannelGoals();
  
  // Get all sales in the date range
  const sales = await db.select()
    .from(dailySales)
    .where(sql`${dailySales.saleDate} >= ${startDate} AND ${dailySales.saleDate} <= ${endDate}`);
  
  // Calculate days in period
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Get all stock info
  const allStocks = await db.select().from(productStock);
  const allMarketplaceStocks = await db.select().from(marketplaceStock);
  
  const products = allProducts.map(product => {
    // Get sales data
    const productSales = sales.filter(s => s.productId === product.id);
    const totalSales = productSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = productSales.reduce((sum, s) => sum + (s.revenue || 0), 0);
    
    // Calculate daily goal
    let dailyGoal = 0;
    for (const channel of allChannels) {
      const goal = goals.find(g => g.productId === product.id && g.channelId === channel.id);
      dailyGoal += goal?.dailyGoal || channel.dailyGoal;
    }
    if (dailyGoal === 0) dailyGoal = product.dailyGoal;
    
    const periodGoal = dailyGoal * daysInPeriod;
    const avgSalesPerDay = totalSales / daysInPeriod;
    
    // Get stock info
    const stock = allStocks.find(s => s.productId === product.id);
    const crossdockingStock = stock?.crossdockingStock || 0;
    const totalStock = crossdockingStock + (allMarketplaceStocks
      .filter(ms => ms.productId === product.id)
      .reduce((sum, ms) => sum + ms.stock, 0) || 0);
    
    // Calculate stock coverage
    const daysOfStockAvailable = avgSalesPerDay > 0 ? Math.round(totalStock / avgSalesPerDay) : 0;
    const stockCoveragePercentage = periodGoal > 0 ? Math.round((totalStock / periodGoal) * 100) : 0;
    
    // Determine risk level
    let riskLevel: 'green' | 'yellow' | 'red' = 'green';
    if (stockCoveragePercentage < 50) {
      riskLevel = 'red';
    } else if (stockCoveragePercentage < 100) {
      riskLevel = 'yellow';
    }
    
    return {
      ...product,
      totalSales,
      totalRevenue,
      dailyGoal,
      periodGoal,
      avgSalesPerDay: Math.round(avgSalesPerDay * 100) / 100,
      crossdockingStock,
      totalStock,
      daysOfStockAvailable,
      stockCoveragePercentage,
      riskLevel,
    };
  });
  
  return products;
}


// ============ STOCK METRICS ============

export interface StockMetrics {
  totalStock: number;
  crossdockingStock: number;
  daysOfStockAvailable: number;
  stockCoveragePercentage: number;
  riskLevel: 'green' | 'yellow' | 'red';
  marketplaceDistribution: {
    channelId: number;
    channelName: string;
    stock: number;
    percentage: number;
  }[];
  reabastecimentoRecomendado: number;
  previsaoFaltaEstoque: number | null; // dias até acabar
}

export async function calculateStockMetrics(
  productId: number,
  periodGoal: number,
  avgSalesPerDay: number,
  daysInPeriod: number
): Promise<StockMetrics> {
  const db = await getDb();
  if (!db) return {
    totalStock: 0,
    crossdockingStock: 0,
    daysOfStockAvailable: 0,
    stockCoveragePercentage: 0,
    riskLevel: 'red',
    marketplaceDistribution: [],
    reabastecimentoRecomendado: 0,
    previsaoFaltaEstoque: null,
  };

  // Get stock info
  const stock = await db.select()
    .from(productStock)
    .where(eq(productStock.productId, productId))
    .limit(1);

  const marketplaceStocks = await db.select()
    .from(marketplaceStock)
    .where(eq(marketplaceStock.productId, productId));

  const crossdockingStock = stock[0]?.crossdockingStock || 0;
  const totalStock = crossdockingStock + (marketplaceStocks.reduce((sum, ms) => sum + ms.stock, 0) || 0);

  // Calculate days of stock available
  const daysOfStockAvailable = avgSalesPerDay > 0 ? Math.round(totalStock / avgSalesPerDay) : 0;

  // Calculate stock coverage percentage
  const stockCoveragePercentage = periodGoal > 0 ? Math.round((totalStock / periodGoal) * 100) : 0;

  // Determine risk level
  let riskLevel: 'green' | 'yellow' | 'red' = 'green';
  if (stockCoveragePercentage < 50) {
    riskLevel = 'red';
  } else if (stockCoveragePercentage < 100) {
    riskLevel = 'yellow';
  }

  // Get channels for distribution
  const channels = await getAllChannels();
  const marketplaceDistribution = channels.map(channel => {
    const channelStock = marketplaceStocks.find(ms => ms.channelId === channel.id);
    const stock = channelStock?.stock || 0;
    const percentage = totalStock > 0 ? Math.round((stock / totalStock) * 100) : 0;
    return {
      channelId: channel.id,
      channelName: channel.name,
      stock,
      percentage,
    };
  }).filter(d => d.stock > 0);

  // Calculate recommended restocking
  const dailyGoal = periodGoal / daysInPeriod;
  const reabastecimentoRecomendado = Math.max(0, Math.ceil(dailyGoal * 30 - totalStock)); // 30 dias de cobertura

  // Calculate forecast of stock depletion
  let previsaoFaltaEstoque: number | null = null;
  if (avgSalesPerDay > 0 && totalStock > 0) {
    previsaoFaltaEstoque = Math.round(totalStock / avgSalesPerDay);
  }

  return {
    totalStock,
    crossdockingStock,
    daysOfStockAvailable,
    stockCoveragePercentage,
    riskLevel,
    marketplaceDistribution,
    reabastecimentoRecomendado,
    previsaoFaltaEstoque,
  };
}


// ============ PRODUCT LISTING LINKS ============

export async function upsertProductListingLink(
  productId: number,
  channelId: number,
  listingUrl: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Check if link already exists
    const existing = await db.select()
      .from(productListingLinks)
      .where(and(
        eq(productListingLinks.productId, productId),
        eq(productListingLinks.channelId, channelId)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing link
      await db.update(productListingLinks)
        .set({ listingUrl })
        .where(and(
          eq(productListingLinks.productId, productId),
          eq(productListingLinks.channelId, channelId)
        ));
    } else {
      // Insert new link
      await db.insert(productListingLinks).values({
        productId,
        channelId,
        listingUrl,
      });
    }
  } catch (error) {
    console.error("[DB] Error upserting product listing link:", error);
  }
}

export async function getProductListingLinks(productId: number): Promise<ProductListingLink[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select()
      .from(productListingLinks)
      .where(eq(productListingLinks.productId, productId));
  } catch (error) {
    console.error("[DB] Error getting product listing links:", error);
    return [];
  }
}

export async function getProductListingLinksByChannel(
  productId: number,
  channelId: number
): Promise<ProductListingLink | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select()
      .from(productListingLinks)
      .where(and(
        eq(productListingLinks.productId, productId),
        eq(productListingLinks.channelId, channelId)
      ))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Error getting product listing link:", error);
    return null;
  }
}

export async function deleteProductListingLink(
  productId: number,
  channelId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.delete(productListingLinks)
      .where(and(
        eq(productListingLinks.productId, productId),
        eq(productListingLinks.channelId, channelId)
      ));
  } catch (error) {
    console.error("[DB] Error deleting product listing link:", error);
  }
}


// ============ PRODUCT CHANNEL STOCK TYPES ============

export async function upsertProductChannelStockType(
  productId: number,
  channelId: number,
  fullStock: number,
  crossStock: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(productChannelStockTypes).values({
      productId,
      channelId,
      fullStock,
      crossStock,
    }).onDuplicateKeyUpdate({
      set: { fullStock, crossStock },
    });
  } catch (error) {
    console.error("[DB] Error upserting product channel stock type:", error);
  }
}

export async function getProductChannelStockType(
  productId: number,
  channelId: number
): Promise<ProductChannelStockType | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select()
      .from(productChannelStockTypes)
      .where(and(
        eq(productChannelStockTypes.productId, productId),
        eq(productChannelStockTypes.channelId, channelId)
      ))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Error getting product channel stock type:", error);
    return null;
  }
}

export async function getProductChannelStockTypes(productId: number): Promise<ProductChannelStockType[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select()
      .from(productChannelStockTypes)
      .where(eq(productChannelStockTypes.productId, productId));
  } catch (error) {
    console.error("[DB] Error getting product channel stock types:", error);
    return [];
  }
}

// ============ REVENUE BY CATEGORY ============

export async function getRevenueByCategory(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  
  const allProducts = await getAllProducts();
  
  // Get all sales in the date range
  const sales = await db.select()
    .from(dailySales)
    .where(sql`${dailySales.saleDate} >= ${startDate} AND ${dailySales.saleDate} <= ${endDate}`);
  
  // Group by category
  const categoryMap = new Map<string, { revenue: number; quantity: number }>();
  
  allProducts.forEach(product => {
    const category = product.category || 'Sem Categoria';
    const productSales = sales.filter(s => s.productId === product.id);
    const categoryRevenue = productSales.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const categoryQuantity = productSales.reduce((sum, s) => sum + s.quantity, 0);
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { revenue: 0, quantity: 0 });
    }
    
    const current = categoryMap.get(category)!;
    current.revenue += categoryRevenue;
    current.quantity += categoryQuantity;
  });
  
  // Convert to array and sort by revenue
  const result = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    revenue: data.revenue,
    quantity: data.quantity,
    formattedRevenue: (data.revenue / 100).toFixed(2), // Convert from cents to real
  })).sort((a, b) => b.revenue - a.revenue);
  
  return result;
}
