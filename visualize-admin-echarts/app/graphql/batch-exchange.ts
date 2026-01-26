import {
  Exchange,
  Operation,
  OperationResult,
  makeOperation,
} from "@urql/core";
import { pipe, map, mergeMap, fromPromise, filter, takeUntil } from "wonka";

interface BatchedOperation {
  operation: Operation;
  resolve: (result: OperationResult) => void;
}

interface BatchConfig {
  /** Max time to wait before sending batch (ms). Default: 10 */
  maxDelay?: number;
  /** Max operations per batch. Default: 20 */
  maxSize?: number;
}

/**
 * Custom URQL exchange that batches multiple GraphQL operations into a single HTTP request.
 * Apollo Server supports receiving an array of operations and returns an array of results.
 */
export const batchExchange =
  (config: BatchConfig = {}): Exchange =>
  ({ forward, client }) => {
    const { maxDelay = 10, maxSize = 20 } = config;

    let batch: BatchedOperation[] = [];
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const executeBatch = async () => {
      if (batch.length === 0) return;

      const currentBatch = [...batch];
      batch = [];
      timeoutId = null;

      if (currentBatch.length === 1) {
        // Single operation - no need to batch
        const { operation, resolve } = currentBatch[0];
        const result = await executeSingleOperation(operation);
        resolve(result);
        return;
      }

      // Build batched request body
      const batchedBody = currentBatch.map(({ operation }) => ({
        query: operation.query.loc?.source.body || "",
        variables: operation.variables,
        operationName: operation.kind === "query" ? getOperationName(operation) : undefined,
      }));

      try {
        const response = await fetch(client.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...((operation) => {
              const fetchOpts = typeof client.fetchOptions === "function"
                ? client.fetchOptions()
                : client.fetchOptions;
              return fetchOpts?.headers || {};
            })(currentBatch[0].operation),
          },
          body: JSON.stringify(batchedBody),
        });

        const results = await response.json();

        // Distribute results back to individual operations
        if (Array.isArray(results)) {
          results.forEach((result, index) => {
            if (currentBatch[index]) {
              currentBatch[index].resolve({
                operation: currentBatch[index].operation,
                data: result.data,
                error: result.errors ? { graphQLErrors: result.errors } as any : undefined,
                extensions: result.extensions,
                stale: false,
                hasNext: false,
              });
            }
          });
        } else {
          // Server returned single result (shouldn't happen with Apollo)
          console.warn("[batch-exchange] Expected array response, got single result");
          currentBatch.forEach(({ resolve, operation }) => {
            resolve({
              operation,
              data: results.data,
              error: results.errors ? { graphQLErrors: results.errors } as any : undefined,
              extensions: results.extensions,
              stale: false,
              hasNext: false,
            });
          });
        }
      } catch (error) {
        // On error, reject all operations in batch
        currentBatch.forEach(({ resolve, operation }) => {
          resolve({
            operation,
            data: undefined,
            error: error as any,
            stale: false,
            hasNext: false,
          });
        });
      }
    };

    const executeSingleOperation = async (operation: Operation): Promise<OperationResult> => {
      const body = {
        query: operation.query.loc?.source.body || "",
        variables: operation.variables,
        operationName: getOperationName(operation),
      };

      const fetchOpts = typeof client.fetchOptions === "function"
        ? client.fetchOptions()
        : client.fetchOptions;

      const response = await fetch(client.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...fetchOpts?.headers,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      return {
        operation,
        data: result.data,
        error: result.errors ? { graphQLErrors: result.errors } as any : undefined,
        extensions: result.extensions,
        stale: false,
        hasNext: false,
      };
    };

    const scheduleBatch = (batchedOp: BatchedOperation) => {
      batch.push(batchedOp);

      // Execute immediately if batch is full
      if (batch.length >= maxSize) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        executeBatch();
        return;
      }

      // Schedule batch execution
      if (!timeoutId) {
        timeoutId = setTimeout(executeBatch, maxDelay);
      }
    };

    return (operations$) => {
      return pipe(
        operations$,
        mergeMap((operation) => {
          // Only batch queries, not mutations or subscriptions
          if (operation.kind !== "query") {
            return forward(pipe(operations$, filter((op) => op.key === operation.key)));
          }

          return fromPromise(
            new Promise<OperationResult>((resolve) => {
              scheduleBatch({ operation, resolve });
            })
          );
        })
      );
    };
  };

function getOperationName(operation: Operation): string | undefined {
  const definitions = operation.query.definitions;
  for (const def of definitions) {
    if (def.kind === "OperationDefinition" && def.name) {
      return def.name.value;
    }
  }
  return undefined;
}
