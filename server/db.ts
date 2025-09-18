// server/db.ts
import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Cria cliente usando o pacote 'postgres' (conecta ao Neon)
const sql = postgres(process.env.DATABASE_URL, {
  ssl: true,  // ✅ obrigatório no Neon
  max: 10,    // conexões no pool
});

// Instância do Drizzle conectada ao cliente postgres
export const db = drizzle(sql, { schema });

// Exporta também o client raw caso precise de queries manuais
export const sqlClient = sql;
