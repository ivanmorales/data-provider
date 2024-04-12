import byEvent from "../queries/byEvent";

import { useOddsService } from "./useOddsService";
import { useFirebaseService } from "./useFirebaseService";

export const EventLoader = ({ children, ...props }) => {
  if (typeof children !== "function") {
    console.error(`{children} must be passed as a function`);
    return;
  }
  const { eventId, marketId } = props;

  const keys = ["event", eventId];

  const query = byEvent(eventId);
  const oddsResult = useOddsService(keys, {
    query,
    variables: { eid: eventId },
    onSuccess(data) {
      event = data.eventsV2.events.find((event) => event.eid === eventId);
    },
  });

  const fbResult = useFirebaseService([...keys, marketId], {
    path: `/predictions/eid_mtid/${eventId}_${marketId}`,
    subscribe: true,
  });

  if (oddsResult.isLoading) {
    return <span>Loading ...</span>;
  }

  const event = oddsResult.data?.event;

  if (fbResult.isFetched) event.marketPrediction = fbResult.data?.data;
  return children({ event });
};
