import { useContext } from "react";

import byLine from "../queries/byLine";
import { useOddsService } from "./useOddsService";
import { Loading } from "../component/Loading";
import LinesContext from "../context/lines";

export const LinePredictionLoader = ({
  children,
  fallback = <Loading />,
  ...props
}) => {
  if (typeof children !== "function") {
    console.error(`{children} must be passed as a function`);
    return;
  }

  const context = useContext(LinesContext)

  const { eventId, marketId, catid, partid } = props;

  const eventCacheKey = ["lineByEvent", `${catid}`, `${eventId}`, `${marketId}`];
  const query = byLine({ catid, eventId, marketId });
  const oddsResult = useOddsService(eventCacheKey, {
    query,
    variables: {},
    onSuccess(data) {
      data.bestLines
    },
  });

  if (oddsResult.isLoading) {
    return fallback;
  }

  const updatedLine = context[`${eventId}-${marketId}`]

  return children({ socketBestLine: updatedLine, oddsV2BestLine: oddsResult.data.bestLines.find((line) => line.mtid === marketId) });
};

// BRB
