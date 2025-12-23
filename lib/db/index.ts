import { Pool } from 'pg';

let pool: Pool;

const globalWithPg = global as typeof globalThis & {
    pgPool?: Pool;
};

if (!process.env.DATABASE_URL) {
    // Only throw in production, or warn in dev
    if (process.env.NODE_ENV === 'production') {
        throw new Error('DATABASE_URL environment variable is missing');
    } else {
        console.warn('DATABASE_URL is missing. Database features will fail.');
    }
}

// Config object
const config = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined,
    max: 10, // Max clients in the pool
    idleTimeoutMillis: 30000,
};

if (process.env.NODE_ENV === 'production') {
    pool = new Pool(config);
} else {
    // In development, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!globalWithPg.pgPool) {
        globalWithPg.pgPool = new Pool(config);
    }
    pool = globalWithPg.pgPool;
}

// Wrapper to prevent "undefined layout" errors if env is missing locally
const query = async (text: string, params?: any[]) => {
    if (!pool) {
        throw new Error('Database pool not initialized. Check DATABASE_URL.');
    }
    return pool.query(text, params);
};

export { pool, query };
