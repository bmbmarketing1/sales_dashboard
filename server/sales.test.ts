import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getAllProducts: vi.fn().mockResolvedValue([
    { id: 1, externalId: 12916, internalCode: "BQ061", description: "COZINHA INFANTIL MODERNA 43 PCS", dailyGoal: 5 },
    { id: 2, externalId: 12904, internalCode: "BQ062", description: "COZINHA INFANTIL MINI CHEF", dailyGoal: 5 },
  ]),
  getAllChannels: vi.fn().mockResolvedValue([
    { id: 1, name: "Amazon", dailyGoal: 10 },
    { id: 2, name: "Magalu", dailyGoal: 10 },
    { id: 3, name: "Mercado Livre", dailyGoal: 10 },
    { id: 4, name: "Shopee", dailyGoal: 10 },
    { id: 5, name: "TikTok", dailyGoal: 10 },
  ]),
  getAllProductChannelGoals: vi.fn().mockResolvedValue([]),
  getProductSalesWithChannels: vi.fn().mockResolvedValue([
    {
      id: 1,
      externalId: 12916,
      internalCode: "BQ061",
      description: "COZINHA INFANTIL MODERNA 43 PCS",
      dailyGoal: 5,
      totalSales: 3,
      channelSales: [
        { channelId: 1, channelName: "Amazon", quantity: 1, channelGoal: 2 },
        { channelId: 2, channelName: "Magalu", quantity: 0, channelGoal: 1 },
        { channelId: 3, channelName: "Mercado Livre", quantity: 2, channelGoal: 2 },
        { channelId: 4, channelName: "Shopee", quantity: 0, channelGoal: 0 },
        { channelId: 5, channelName: "TikTok", quantity: 0, channelGoal: 0 },
      ],
    },
  ]),
  getMonthlyAverages: vi.fn().mockResolvedValue([
    { productId: 1, totalQuantity: 30, daysWithSales: 10 },
  ]),
  getProductById: vi.fn().mockResolvedValue({
    id: 1,
    externalId: 12916,
    internalCode: "BQ061",
    description: "COZINHA INFANTIL MODERNA 43 PCS",
    dailyGoal: 5,
  }),
  getProductSalesHistory: vi.fn().mockResolvedValue([
    {
      date: "2025-12-01",
      totalSales: 3,
      dailyGoal: 5,
      metGoal: false,
      percentage: 60,
      channelSales: [
        { channelId: 1, channelName: "Amazon", quantity: 1, channelGoal: 2 },
      ],
    },
  ]),
  getProductChannelSummary: vi.fn().mockResolvedValue([
    { channelId: 1, channelName: "Amazon", totalSales: 10, daysWithSales: 3, dailyGoal: 2 },
  ]),
  clearAllSalesData: vi.fn().mockResolvedValue({
    salesDeleted: 50,
    importsDeleted: 3,
  }),
  getProductsInsights: vi.fn().mockResolvedValue({
    meetingGoal: [
      { productId: 1, internalCode: "BQ061", description: "Test Product 1", totalSales: 120, totalGoal: 100, percentage: 120, dailyGoal: 10 },
    ],
    notMeetingGoal: [
      { productId: 2, internalCode: "BQ062", description: "Test Product 2", totalSales: 50, totalGoal: 100, percentage: 50, dailyGoal: 10 },
    ],
    daysInPeriod: 10,
  }),
  getProductSalesWithChannelsByPeriod: vi.fn().mockResolvedValue({
    products: [
      {
        id: 1,
        externalId: 12916,
        internalCode: "BQ061",
        description: "COZINHA INFANTIL MODERNA 43 PCS",
        dailyGoal: 10,
        periodGoal: 30,
        totalSales: 50,
        channelSales: [
          { channelId: 1, channelName: "Amazon", quantity: 20, channelGoal: 4, periodGoal: 12 },
          { channelId: 2, channelName: "Magalu", quantity: 15, channelGoal: 3, periodGoal: 9 },
          { channelId: 3, channelName: "Mercado Livre", quantity: 15, channelGoal: 3, periodGoal: 9 },
        ],
      },
    ],
    daysInPeriod: 3,
  }),
  getDailyTotals: vi.fn().mockResolvedValue([
    { saleDate: new Date("2025-12-01"), totalQuantity: 29 },
    { saleDate: new Date("2025-12-02"), totalQuantity: 40 },
    { saleDate: new Date("2025-12-03"), totalQuantity: 62 },
  ]),
  updateProductGoal: vi.fn().mockResolvedValue(undefined),
  updateChannelGoal: vi.fn().mockResolvedValue(undefined),
  upsertProductChannelGoal: vi.fn().mockResolvedValue(undefined),
  initializeDatabase: vi.fn().mockResolvedValue(undefined),
  getImportedFiles: vi.fn().mockResolvedValue([]),
  isFileAlreadyImported: vi.fn().mockResolvedValue(false),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("products router", () => {
  it("lists all products", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.list();

    expect(result).toHaveLength(2);
    expect(result[0].internalCode).toBe("BQ061");
  });

  it("updates product goal when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.updateGoal({
      productId: 1,
      dailyGoal: 10,
    });

    expect(result).toEqual({ success: true });
  });
});

describe("channels router", () => {
  it("lists all channels", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.channels.list();

    expect(result).toHaveLength(5);
    expect(result[0].name).toBe("Amazon");
  });
});

describe("sales router", () => {
  it("returns sales by date", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sales.byDate({ date: "2025-12-01" });

    expect(result).toHaveLength(1);
    expect(result[0].totalSales).toBe(3);
    expect(result[0].channelSales).toHaveLength(5);
  });

  it("returns monthly averages", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sales.monthlyAverages({ year: 2025, month: 12 });

    expect(result).toHaveLength(1);
    expect(result[0].totalQuantity).toBe(30);
    expect(result[0].daysWithSales).toBe(10);
  });

  it("returns daily totals for chart", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sales.dailyTotals({ year: 2025, month: 12 });

    expect(result).toHaveLength(3);
    expect(result[0].totalQuantity).toBe(29);
    expect(result[1].totalQuantity).toBe(40);
    expect(result[2].totalQuantity).toBe(62);
  });
});

describe("productChannelGoals router", () => {
  it("lists all product channel goals", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.productChannelGoals.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("updates product channel goal when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.productChannelGoals.update({
      productId: 1,
      channelId: 1,
      dailyGoal: 5,
    });

    expect(result).toEqual({ success: true });
  });
});

describe("init router", () => {
  it("seeds database when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.init.seed();

    expect(result).toEqual({ success: true });
  });
});

describe("products detail router", () => {
  it("returns product by id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.byId({ productId: 1 });

    expect(result).not.toBeNull();
    expect(result?.internalCode).toBe("BQ061");
  });

  it("returns product sales history", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.history({
      productId: 1,
      startDate: "2025-12-01",
      endDate: "2025-12-31",
    });

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2025-12-01");
    expect(result[0].totalSales).toBe(3);
  });

  it("returns product channel summary", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.channelSummary({
      productId: 1,
      startDate: "2025-12-01",
      endDate: "2025-12-31",
    });

    expect(result).toHaveLength(1);
    expect(result[0].channelName).toBe("Amazon");
    expect(result[0].totalSales).toBe(10);
  });
});

describe("data management router", () => {
  it("clears all sales data when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.data.clearAll();

    expect(result.success).toBe(true);
    expect(result.salesDeleted).toBe(50);
    expect(result.importsDeleted).toBe(3);
  });
});

describe("sales.byPeriod router", () => {
  it("returns products with period totals", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sales.byPeriod({
      startDate: "2025-12-01",
      endDate: "2025-12-03",
    });

    expect(result).toHaveProperty("products");
    expect(result).toHaveProperty("daysInPeriod");
    expect(Array.isArray(result.products)).toBe(true);
    expect(result.daysInPeriod).toBe(3);
    expect(result.products[0].periodGoal).toBe(30);
    expect(result.products[0].totalSales).toBe(50);
  });
});

describe("insights router", () => {
  it("returns products meeting and not meeting goals", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.insights.byPeriod({
      startDate: "2025-12-01",
      endDate: "2025-12-10",
    });

    expect(result.meetingGoal).toHaveLength(1);
    expect(result.notMeetingGoal).toHaveLength(1);
    expect(result.daysInPeriod).toBe(10);
    expect(result.meetingGoal[0].percentage).toBe(120);
    expect(result.notMeetingGoal[0].percentage).toBe(50);
  });
});
