
export class OfflineTextEmbedding {

    public async embed(data: string): Promise<number[][]> {
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
                console.log(response);
                return [];
            }

            const jsonData = await response.json();
            return JSON.parse(jsonData)[0] as number[][];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.log(errorMessage);
            return [];
        }
    }
}

