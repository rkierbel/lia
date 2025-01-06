import {HfFeatExtractHttpResponse} from '../interface/hf-feat-extract-http-response.js';

export class OfflineTextEmbedding {

    public async embed(data: string): Promise<HfFeatExtractHttpResponse> {
        try {
            const response = await fetch(
                'https://z4g6g8n5rney8aq1.us-east4.gcp.endpoints.huggingface.cloud',
                {
                    headers: {
                        Accept: 'application/json',
                        Authorization: 'Bearer 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',
                        'Content-Type': 'application/json',
                    },
                    method: 'POST',
                    body: JSON.stringify({
                        inputs: data
                    }),

                }
            );

            if (!response.ok) {
                return {
                    success: false,
                    error: `HTTP error! status: ${response.status}`
                };
            }

            const jsonData = await response.json();
            return {
                success: true,
                data: jsonData
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: `Failed to query API: ${errorMessage}`
            };
        }
    }
}

