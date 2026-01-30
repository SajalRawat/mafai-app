import { logger } from './logger';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://maf-ai:11434';

export async function createCustomModel(modelName: string, systemPrompt: string, fromModel: string = 'mistral') {
    logger.info(`Creating custom model ${modelName} from ${fromModel}...`);

    try {
        const body = {
            model: modelName,
            from: fromModel,
            system: systemPrompt
        };

        const response = await fetch(`${OLLAMA_HOST}/api/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`Failed to create model: ${response.statusText}`, errorText);
            throw new Error(`Failed to create model: ${errorText}`);
        }

        // The response is a stream of status updates. We can just wait for it to finish or assume if 200 it's processing.
        // For simplicity in this call, we might assume if we get a 200 OK stream start, it's good, 
        // but robust implementation should ideally read the stream to completion.
        // However, standard fetch waits for headers. 
        // Let's read the stream to ensure completion.

        const reader = response.body?.getReader();
        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                // Optional: log progress
            }
        }

        logger.info(`Successfully created model ${modelName}`);
        return true;
    } catch (error) {
        logger.error('Error creating custom model', error);
        throw error;
    }
}
