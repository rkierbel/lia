import {DataType} from '@zilliz/milvus2-sdk-node';

export interface LegalArticle {
    vector: string,
    id: string,
    partitionKey: string
}

export const legalArticleSchema = [
    {
        name: "article-id",
        data_type: DataType.VarChar,
        max_length: 10,
        is_primary_key: true,
        autoID: false
    },
    {
        name: "article-partition-key",
        data_type: DataType.VarChar,
        max_length: 50,
        isPartitionKey: true
    },
    {
        name: "article-vector",
        data_type: DataType.FloatVector,
        dim: 3584
    }
]