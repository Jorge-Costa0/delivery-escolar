import { 
  users, products, orders, orderItems,
  type User, type InsertUser,
  type Product, type InsertProduct, 
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type CreateOrderItem
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, sql, ilike, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product methods
  getProducts(search?: string, flavor?: string, priceRange?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductStock(id: string, stock: number): Promise<Product | undefined>;
  
  // Order methods
  getOrders(userId?: string, status?: string): Promise<(Order & { user: User; orderItems: (OrderItem & { product: Product })[] })[]>;
  getOrder(id: string): Promise<(Order & { user: User; orderItems: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(order: InsertOrder, items: CreateOrderItem[]): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  // Admin stats
  getTodayStats(): Promise<{
    ordersToday: number;
    revenueToday: number;
    lowStockCount: number;
    deliveryRate: number;
  }>;
  
  getLowStockProducts(): Promise<Product[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProducts(search?: string, flavor?: string, priceRange?: string): Promise<Product[]> {
    let query = db.select().from(products).where(eq(products.isActive, true));
    
    const conditions = [eq(products.isActive, true)];
    
    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }
    
    if (flavor && flavor !== 'all') {
      conditions.push(ilike(products.name, `%${flavor}%`));
    }
    
    if (conditions.length > 1) {
      query = db.select().from(products).where(and(...conditions));
    }
    
    const result = await query.orderBy(asc(products.name));
    return result;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateProductStock(id: string, stock: number): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ stock })
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  async getOrders(userId?: string, status?: string): Promise<(Order & { user: User; orderItems: (OrderItem & { product: Product })[] })[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(orders.userId, userId));
    }
    
    if (status && status !== 'all') {
      conditions.push(eq(orders.status, status as any));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const result = await db.query.orders.findMany({
      where: whereClause,
      with: {
        user: true,
        orderItems: {
          with: {
            product: true,
          },
        },
      },
      orderBy: desc(orders.createdAt),
    });
    
    return result;
  }

  async getOrder(id: string): Promise<(Order & { user: User; orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const result = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        user: true,
        orderItems: {
          with: {
            product: true,
          },
        },
      },
    });
    
    return result || undefined;
  }

  async createOrder(order: InsertOrder, items: CreateOrderItem[]): Promise<Order> {
    const [newOrder] = await db.transaction(async (tx) => {
      // Create the order
      const [createdOrder] = await tx
        .insert(orders)
        .values(order)
        .returning();

      // Create order items
      const orderItemsWithOrderId = items.map(item => ({
        ...item,
        orderId: createdOrder.id,
      }));

      await tx.insert(orderItems).values(orderItemsWithOrderId);

      // Update product stock
      for (const item of items) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      return [createdOrder];
    });

    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ 
        status: status as any,
        updatedAt: sql`now()`,
      })
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  async getTodayStats(): Promise<{
    ordersToday: number;
    revenueToday: number;
    lowStockCount: number;
    deliveryRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Orders today
    const [ordersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(sql`DATE(${orders.createdAt}) = CURRENT_DATE`);

    // Revenue today
    const [revenueResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${orders.total}), 0)` })
      .from(orders)
      .where(sql`DATE(${orders.createdAt}) = CURRENT_DATE`);

    // Low stock count
    const [lowStockResult] = await db
      .select({ count: count() })
      .from(products)
      .where(and(eq(products.isActive, true), sql`${products.stock} < 5`));

    // Delivery rate (delivered vs total orders)
    const [deliveredResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(and(
        sql`DATE(${orders.createdAt}) = CURRENT_DATE`,
        eq(orders.status, 'delivered')
      ));

    const totalOrders = ordersResult.count;
    const deliveredOrders = deliveredResult.count;
    const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    return {
      ordersToday: totalOrders,
      revenueToday: Number(revenueResult.total) || 0,
      lowStockCount: lowStockResult.count,
      deliveryRate,
    };
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), sql`${products.stock} < 5`))
      .orderBy(asc(products.stock));
  }
}

export const storage = new DatabaseStorage();
