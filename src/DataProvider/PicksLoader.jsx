import byLeague from "../queries/byLeague";

import { useOddsService, buildKey } from "./useOddsService";
import { useFirebaseService } from "./useFirebaseService";

// NEEDS TO BUILD THE BODIES AGAIN
// WE DON'T NEED eventPicks, need to add consensus y stats to the eventsByDate Query
export const PicksLoader = ({ children, ...props }) => {
  if (typeof children !== "function") {
    console.error(`{children} must be passed as a function`);
    return;
  }
  const { leagueId, mtid, date } = props;

  const keys = ["league", leagueId];

  const query = byLeague({
    lid: leagueId,
    fastForward: true,
    paid: "[101,106,113,102,98,109,115,122,99]",
    date,
    hoursRange: 24,
    fastForwardOffset: -7,
    mtid: JSON.stringify(mtid) // [401, 83, 402],
  });
  const oddsResult = useOddsService(keys, {
    query,
    variables: {},
    async onSuccess(data, cacheData) {
      if (!data.eventsByDateNew) return;
      data.eventsByDateNew.events.forEach((event) => {
        const queryKey = buildKey(["event", event.eid]);
        cacheData(queryKey, { event });
      });
    },
  });

  if (oddsResult.isLoading) {
    return <span>Loading ...</span>;
  }

  const events = oddsResult.data?.eventsByDateNew.events;

  return children({ events });
};
