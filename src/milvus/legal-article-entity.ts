import {DataType} from '@zilliz/milvus2-sdk-node';

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
        name: "articleVector",
        data_type: DataType.FloatVector,
        dim: 3584
    }
]