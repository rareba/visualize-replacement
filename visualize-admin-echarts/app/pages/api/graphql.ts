import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "@apollo/server-plugin-landing-page-graphql-playground";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { makeExecutableSchema } from "@graphql-tools/schema";
import depthLimit from "graphql-depth-limit";
import { NextApiRequest, NextApiResponse } from "next";

import { createContext, VisualizeGraphQLContext } from "../../graphql/context";
import { resolvers } from "../../graphql/resolvers";
import typeDefs from "../../graphql/schema.graphql";

import "global-agent/bootstrap";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const server = new ApolloServer<VisualizeGraphQLContext>({
  schema,
  allowBatchedHttpRequests: true, // Enable query batching for better performance
  formatError: (formattedError) => {
    console.error("GraphQL Error:", formattedError);
    return formattedError;
  },
  introspection: process.env.NODE_ENV !== "production",
  validationRules: [depthLimit(10)],
  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground(),
    // Plugin to add debug extensions to response
    {
      async requestDidStart() {
        return {
          async willSendResponse({ contextValue, response }) {
            if (contextValue.debug && response.body.kind === "single") {
              response.body.singleResult.extensions = {
                ...response.body.singleResult.extensions,
                queries: contextValue.queries,
                timings: contextValue.timings,
              };
            }
          },
        };
      },
    },
  ],
});

export const config = {
  // see https://vercel.com/docs/functions/configuring-functions/duration
  maxDuration: 60,
};

const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextApiRequest, _res: NextApiResponse) => {
    return createContext({ req });
  },
});

export default handler;
