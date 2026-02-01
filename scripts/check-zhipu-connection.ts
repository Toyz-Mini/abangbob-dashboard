
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (result.error) {
    console.error("Error loading .env.local:", result.error);
}

// Import lib
import { createChatCompletion, ZHIPU_MODELS } from '../lib/zhipu';

async function main() {
    console.log("Testing Zhipu AI Integration...");
    console.log("API Key present:", !!process.env.ZHIPUAI_API_KEY);

    // Convert object values to array
    const modelsToTry = Object.values(ZHIPU_MODELS);

    console.log(`Found ${modelsToTry.length} models to test.`);

    for (const model of modelsToTry) {
        console.log(`\nAttempting with model: ${model}...`);
        try {
            const response: any = await createChatCompletion("Hello", model);
            console.log(`✅ Success with model: ${model}`);
            // return; // Don't return, let's see which ones work
        } catch (error: any) {
            // console.error(`❌ Error with model ${model}:`, error);
            const msg = error?.error?.message || error.message || "Unknown error";
            console.error(`❌ Error with model ${model}: ${msg}`);
        }
    }
}

main();
