import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';

export const legalArticleSchema = [
    {
        name: "articleNumber",
        data_type: DataType.VarChar,
        is_primary_key: true,
        autoID: false
    },
    {
        name: "metadata",
        data_type: DataType.JSON,
    },
    {
        name: "content",
        data_type: DataType.Array,
        element_type: DataType.JSON
    },
    {
        name: "paragraph",
        data_type: ""
    }
]