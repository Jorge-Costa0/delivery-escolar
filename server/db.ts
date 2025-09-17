// server/db.ts  (substitua o arquivo existente por este)
import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Cria cliente usando o pacote 'postgres' (conecta diretamente ao Postgres)
const sql = postgres(process.env.DATABASE_URL, {
  ssl: false, // se usa SSL (ex.: em produção) ajuste aqui
  max: 10,    // conexões pool (ajuste conforme necessidade)
});

// Cria a instância do Drizzle ligada ao cliente 'postgres'
export const db = drizzle(sql, { schema });

// Exporta também a instância raw caso precise executar queries ad-hoc
export const sqlClient = sql;
