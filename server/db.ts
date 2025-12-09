import { eq, and, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  products, InsertProduct, Product,
  channels, InsertChannel, Channel,
  dailySales, InsertDailySale, DailySale,
  productChannelGoals, InsertProductChannelGoal,
  importedFiles, InsertImportedFile
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

export async function upsertDailySale(productId: number, channelId: number, saleDate: string, quantity: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Check if record exists
  const existing = await db.select()
    .from(dailySales)
    .where(sql`${dailySales.productId} = ${productId} AND ${dailySales.channelId} = ${channelId} AND ${dailySales.saleDate} = ${saleDate}`)
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(dailySales)
      .set({ quantity })
      .where(eq(dailySales.id, existing[0].id));
  } else {
    await db.insert(dailySales).values({
      productId,
      channelId,
      saleDate: new Date(saleDate),
      quantity,
    });
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
    
    return {
      ...product,
      totalSales,
      channelSales,
    };
  });
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
  
  return result;
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

// ============ INITIALIZATION ============

export async function initializeDatabase(): Promise<void> {
  await seedProducts();
  await seedChannels();
}
