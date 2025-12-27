import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export const GET = async (req: Request) => {
    try {
        return await handler.GET(req);
    } catch (error) {
        console.error("[Better Auth GET Error]:", error);
        throw error;
    }
};

export const POST = async (req: Request) => {
    try {
        return await handler.POST(req);
    } catch (error) {
        console.error("[Better Auth POST Error]:", error);
        throw error;
    }
};
