import { useEffect } from "react";

import byEvent from "../queries/byEvent";

import { useOddsService } from "./useOddsService";
import { useFirebaseService } from "./useFirebaseService";
import { Loading } from "../component/Loading";

export const EventPredictionLoader = ({
  children,
  fallback = <Loading />,
  ...props
}) => {
  if (typeof children !== "function") {
    console.error(`{children} must be passed as a function`);
    return;
  }
  const { eventId, marketId } = props;

  const eventCacheKey = ["event", eventId];

  const query = byEvent(eventId);
  const oddsResult = useOddsService(eventCacheKey, {
    query,
    variables: { eid: eventId },
    onSuccess(data) {
      data.eventsV2.events.find((event) => event.eid === eventId);
    },
  });

  const fbResult = useFirebaseService([...eventCacheKey, marketId], {
    path: `/predictions/eid_mtid/${eventId}_${marketId}`,
    subscribe: true,
  });

  if (oddsResult.isLoading) {
    return fallback;
  }

  const event = oddsResult.data?.event;

  if (fbResult.isFetched) event.prediction = fbResult.data?.data;

  return children({ event });
};

// BRB
