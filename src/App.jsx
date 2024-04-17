import "./App.css";
import { QueryClient } from "@tanstack/react-query";
import { DataProvider } from "./DataProvider";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

import { compress, decompress } from "lz-string";
import { EventLoader } from "./DataProvider/EventLoader";
import { LeagueEventLoader } from "./DataProvider/LeagueEventLoader";
import { EventPredictionLoader } from "./DataProvider/EventPredictionLoader";
import { LinePredictionLoader } from "./DataProvider/LinePredictionLoader";
// import { PicksLoader } from "./DataProvider/PicksLoader";
import { EventCard } from "./component/EventCard";
import { Loading } from "./component/Loading";

const queryClient = new QueryClient({
  // defaultOptions: { queries: { staleTime: 1000 * 60 } },
  defaultOptions: { queries: { staleTime: 1000 * 10 } },
});

persistQueryClient({
  queryClient: queryClient,
  persister: createSyncStoragePersister({
    storage: window.localStorage,
    // serialize: (data) => compress(JSON.stringify(data)),
    // deserialize: (data) => JSON.parse(decompress(data)),
  }),
  maxAge: Infinity,
});

const picksMarkets = [401, 402];

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const LEAGUE = 5;
const DATE = 1712041200000;
const EVENT_STATUSES = [
  "scheduled",
  "in-progress",
  "complete",
  "suspended",
  "delayed",
  "postponed",
  "retired",
  "canceled",
  "unknown",
];
const MARKETS = [1607, 1608, 1609];
const CATID = 10

function App() {
  return (
    <DataProvider client={queryClient}>
      <LeagueEventLoader
        leagueId={LEAGUE}
        date={DATE}
        eventStatuses={EVENT_STATUSES}
        
        markets={MARKETS}
        catid={CATID}
      >
        {({ events }) =>
          events.map((event) => (
            <EventCard event={event} key={event.eid}>
              {MARKETS.map((market) => (
                <EventPredictionLoader
                  eventId={event.eid}
                  marketId={market}
                  fallback={<Loading />}
                  key={market}
                >
                  {({ event: { prediction } }) => (
                    <LinePredictionLoader eventId={event.eid} catid={CATID} marketId={market} partid={prediction?.partid}>
                      {({ line }) => (
                        <pre>{JSON.stringify({line, prediction}, null, 2)}</pre>
                      )}
                    </LinePredictionLoader>
                  )}
                </EventPredictionLoader>
              ))}
            </EventCard>
          ))
        }
      </LeagueEventLoader>
    </DataProvider>
  );
}

export default App;
