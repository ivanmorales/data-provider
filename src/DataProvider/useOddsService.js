import { useQuery } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

const oddsClient = new GraphQLClient(import.meta.env.VITE_ODDSTRADER_ENDPOINT, {
  method: "GET",
});

export const useOddsService = (keys, { query, variables = {} }) => {
  const queryKey = ["oddsservice", ...keys];

  const response = useQuery({
    queryKey,
    queryFn: async () => oddsClient.request(query, variables),
  });

  return response;
};
