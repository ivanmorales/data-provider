import { useEffect } from "react";

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

  const keys = ["picks", leagueId];

  const query = byLeague({
    lid: leagueId,
    fastForward: true,
    paid: "[101,106,113,102,98,109,115,122,99]",
    eventStatus: JSON.stringify(["scheduled", "in-progress", "complete", "suspended", "delayed", "postponed", "retired", "canceled", "unknown"]),
    date,
    hoursRange: 24,
    fastForwardOffset: -7,
    mtid: JSON.stringify(mtid) // [1607, 1608, 1609],
  });
  const oddsResult = useOddsService(keys, {
    query,
    variables: {},
    async onSuccess(data, cacheData) {
      if (!data.eventsByDateNew) return;
      
      data.eventsByDateNew.events.forEach((event) => {
        const queryKey = buildKey(["eventPrediction", event.eid]);
        cacheData(queryKey, { event });
      });
    },
  });

  // WANT TO GET ALL THE RECORDS IN A PATH LIKE THIS
  // 'predictions/picks/{leagueId}_{date}'
  // Then, in the EventPredictionLoader we're gonna check if it already exists, in order to use it with the key
  // The EventPredictionLoader should subscribe to
  // 'predictions/picks/{eid}_{mtid}' // Three times, once per each market
  const fbResult = useFirebaseService([...keys, leagueId, date], {
    path: '/predictions/eid_mtid', // NEED A CORRECT LIST FOR THE EID AND THE MTID
    subscribe: false,
    limit: 5,
  });

  if (oddsResult.isLoading) {
    return <span>Loading ...</span>;
  }

  const events = oddsResult.data?.eventsByDateNew.events;

  console.log(fbResult.data?.data, 'fbResult')

  return children({ events });
};
