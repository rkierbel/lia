import {components} from "@qdrant/js-client-rest/dist/types/openapi/generated_schema";

export type CustomFilter = {
    should? : components["schemas"]["Condition"] | (components["schemas"]["Condition"])[] | (Record<string, unknown> | null);
    min_should? : components["schemas"]["MinShould"] | (Record<string, unknown> | null);
    must? : components["schemas"]["Condition"] | (components["schemas"]["Condition"])[] | (Record<string, unknown> | null);
    must_not? : components["schemas"]["Condition"] | (components["schemas"]["Condition"])[] | (Record<string, unknown> | null);
} | undefined
