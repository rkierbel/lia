import {DataType} from '@zilliz/milvus2-sdk-node';

export interface LegalArticle {
    vector: string,
    id: string,
    partitionKey: string
}

export const legalArticleSchema = [
    {
        name: "articleId",
        data_type: DataType.VarChar,
        max_length: 10,
        is_primary_key: true,
        autoID: false
    },
    {
        name: "partitionKey",
        data_type: DataType.VarChar,
        max_length: 50,
        isPartitionKey: true
    },
    {
        name: "content",
        data_type: DataType.Float16Vector
    }
]