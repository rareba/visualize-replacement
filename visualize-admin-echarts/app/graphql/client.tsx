import { createClient, cacheExchange, fetchExchange } from "urql";

import { GRAPHQL_ENDPOINT } from "@/domain/env";
import { flag } from "@/flags/flag";
// @ts-ignore - dynamic package import based on NODE_ENV
import { devtoolsExchanges } from "@/graphql/devtools";
import { batchExchange } from "@/graphql/batch-exchange";

// Batching is enabled by default - batches queries within 10ms window
// Disable with ?flag_disable_batch=true in URL for debugging
const useBatching = !flag("disable_batch");

export const client = createClient({
  url: GRAPHQL_ENDPOINT,
  exchanges: [
    ...devtoolsExchanges,
    cacheExchange,
    // Batch exchange collects queries and sends them in a single HTTP request
    ...(useBatching ? [batchExchange({ maxDelay: 10, maxSize: 20 })] : []),
    fetchExchange,
  ],
  fetchOptions: {
    headers: getHeaders(),
  },
});

function getHeaders() {
  const debug = flag("debug");
  const disableCache = flag("server-side-cache.disable");

  return {
    "x-visualize-debug": debug ? "true" : "",
    "x-visualize-cache-control": disableCache ? "no-cache" : "",
  };
}
