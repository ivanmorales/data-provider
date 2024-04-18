import "./App.css";
import { QueryClient } from "@tanstack/react-query";
import { DataProvider } from "./DataProvider";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

import React from 'react'
import { compress, decompress } from "lz-string";
// import { EventLoader } from "./DataProvider/EventLoader";
import { LeagueEventLoader } from "./DataProvider/LeagueEventLoader";
import { EventPredictionLoader } from "./DataProvider/EventPredictionLoader";
import { LinePredictionLoader } from "./DataProvider/LinePredictionLoader";
// import { PicksLoader } from "./DataProvider/PicksLoader";
import { EventCard } from "./component/EventCard";
import { Loading } from "./component/Loading";
import { WebSocketLoader } from "./DataProvider/WebSocketLoader";

const queryClient = new QueryClient({
  // defaultOptions: { queries: { staleTime: 1000 * 60 } },
  defaultOptions: { queries: { staleTime: 1000 * 10 } },
});

persistQueryClient({
  queryClient: queryClient,
  persister: createSyncStoragePersister({
    storage: window.localStorage,
    serialize: (data) => compress(JSON.stringify(data)),
    deserialize: (data) => JSON.parse(decompress(data)),
  }),
  maxAge: Infinity,
});

// const picksMarkets = [401, 402];

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const LEAGUE = 5;
// April 2, 2024
// const DATE = 1712041200000;
// April 18, 2024
const DATE = 1713423600000;
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
const MARKETS = [401, 402, 83];
const CATID = 10;


const Line = React.memo(({ oddsV2BestLine, socketBestLine = {}, prediction }) => {
  console.log('RENDER', `${socketBestLine.eid}-${socketBestLine.mtid}`)
  return (
    <pre style={{ textAlign: "left" }}>
      {JSON.stringify({ oddsV2BestLine, socketBestLine, prediction }, 0, 2)}
    </pre>
  );
});

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
        {({ events }) => (
          <WebSocketLoader events={events} markets={MARKETS} catid={CATID}>
            {events.map((event) => (
              <EventCard event={event} key={event.eid}>
                {MARKETS.map((market) => (
                  <EventPredictionLoader
                    eventId={event.eid}
                    marketId={market}
                    fallback={<Loading />}
                    key={market}
                  >
                    {({ event: { prediction } }) => (
                      <LinePredictionLoader
                        eventId={event.eid}
                        catid={CATID}
                        marketId={market}
                        partid={prediction?.partid}
                      >
                        {({ oddsV2BestLine, socketBestLine }) => (
                          <Line
                            oddsV2BestLine={oddsV2BestLine}
                            socketBestLine={socketBestLine}
                            prediction={prediction}
                          />
                        )}
                      </LinePredictionLoader>
                    )}
                  </EventPredictionLoader>
                ))}
              </EventCard>
            ))}
          </WebSocketLoader>
        )}
      </LeagueEventLoader>
    </DataProvider>
  );
}

export default App;
