import { betterAuth } from "better-auth";
import { pool } from "@/lib/db";

export const auth = betterAuth({
    database: pool,

    // Email/Password authentication
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Set to true in production
    },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Update session every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minutes
        },
    },

    // User configuration
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "Staff",
            },
            outletId: {
                type: "string",
                required: false,
            },
        },
    },

    // Trust host for deployment
    trustedOrigins: [
        process.env.BETTER_AUTH_URL || "http://localhost:3000",
    ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
