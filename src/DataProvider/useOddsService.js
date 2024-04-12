import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

const oddsClient = new GraphQLClient(import.meta.env.VITE_ODDSTRADER_ENDPOINT, {
  method: "GET",
});

export const buildKey = (keys) => ["oddsservice", ...keys];

export const useOddsService = (keys, { query, variables = {}, onSuccess }) => {
  const queryKey = buildKey(keys);

  const queryClient = useQueryClient();

  const response = useQuery({
    queryKey,
    async queryFn() {
      try {
        const result = await oddsClient.request(query, variables);

        if (onSuccess) {
          const newResult = await onSuccess(result, (key, data) => {
            queryClient.setQueryData(key, (cacheData) => ({
              ...cacheData,
              ...data,
            }));
          });

          if (newResult) return newResult;
        }

        console.log(queryKey, "result");

        return result;
      } catch (err) {
        console.log("testing");
        // console.log(err, "err adcaca");
      }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return response;
};
