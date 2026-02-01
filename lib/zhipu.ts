import { ZhipuAI } from 'zhipuai-sdk-nodejs-v4';

let zhipuInstance: ZhipuAI | null = null;

export const ZHIPU_MODELS = {
    GLM_4_PLUS: 'glm-4-plus',     // Model Flagship - High Intelligence, High Price
    GLM_4_0520: 'glm-4-0520',     // Previous Flagship
    GLM_4: 'glm-4',               // Standard GLM-4
    GLM_4_AIR: 'glm-4-air',       // Cost efficient, good balance
    GLM_4_AIRX: 'glm-4-airx',     // Extremely fast inference
    GLM_4_FLASH: 'glm-4-flash',   // Free/Low cost, fast, good for simple tasks
    GLM_4_FLASHX: 'glm-4-flashx', // Fastest
} as const;

export type ZhipuModelType = typeof ZHIPU_MODELS[keyof typeof ZHIPU_MODELS];

export function getZhipuClient() {
    if (zhipuInstance) return zhipuInstance;

    const apiKey = process.env.ZHIPUAI_API_KEY;

    if (!apiKey) {
        throw new Error('ZHIPUAI_API_KEY is not defined in environment variables.');
    }

    zhipuInstance = new ZhipuAI({
        apiKey: apiKey,
    });

    return zhipuInstance;
}

/**
 * Create a chat completion using Zhipu AI
 * @param prompt User prompt
 * @param model Model code. Defaults to 'glm-4-flash' as it is often free/cheapest.
 */
export async function createChatCompletion(prompt: string, model: string = ZHIPU_MODELS.GLM_4_PLUS) {
    const client = getZhipuClient();

    const response = await client.createCompletions({
        model: model,
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        stream: false,
    });

    return response;
}
