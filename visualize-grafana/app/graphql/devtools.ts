/**
 * GraphQL Devtools Exchanges
 *
 * This file provides a unified export for devtools exchanges.
 * In development, it includes additional debugging tools.
 * In production/test, it uses a minimal setup.
 */

import { gqlFlamegraphExchange } from "@/gql-flamegraph/devtool";

// For tests and production, use minimal devtools setup
export const devtoolsExchanges = [gqlFlamegraphExchange];
