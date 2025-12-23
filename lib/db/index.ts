import { Pool, PoolConfig } from 'pg';

let pool: Pool;

const globalWithPg = global as typeof globalThis & {
    pgPool?: Pool;
};

// Generate config safely
const getConfig = (): PoolConfig => {
    if (!process.env.DATABASE_URL) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('WARN: DATABASE_URL is missing in production build. Database connections will fail.');
        }
        // Return minimal config to allow Pool instantiation without erroring immediately
        return {};
    }

    return {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('supabase')
            ? { rejectUnauthorized: false }
            : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
    };
};

const config = getConfig();

if (process.env.NODE_ENV === 'production') {
    pool = new Pool(config);
} else {
    // In development, use a global variable to preserve connection across HMR
    if (!globalWithPg.pgPool) {
        globalWithPg.pgPool = new Pool(config);
    }
    pool = globalWithPg.pgPool;
}

// Wrapper to prevent usage if misconfigured
const query = async (text: string, params?: any[]) => {
    if (!process.env.DATABASE_URL) {
        throw new Error('Database query failed: DATABASE_URL is missing.');
    }
    return pool.query(text, params);
};

export { pool, query };
