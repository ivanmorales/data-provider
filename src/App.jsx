import "./App.css";
import { QueryClient } from "@tanstack/react-query";
import { DataProvider } from "./DataProvider";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

import { compress, decompress } from "lz-string";
// import { EventLoader } from "./DataProvider/EventLoader";
import { LeagueEventLoader } from "./DataProvider/LeagueEventLoader";
import { EventPredictionLoader } from "./DataProvider/EventPredictionLoader";
import { LinePredictionLoader } from "./DataProvider/LinePredictionLoader";
// import { PicksLoader } from "./DataProvider/PicksLoader";
import { EventCard } from "./component/EventCard";
import { Loading } from "./component/Loading";
import { useLiveOddsSocket } from "./sockets/useWebSocket";

const MOCK_SOCKET = {
  maxSequences: {
    currentLines: {
      maxSequence: 11804170498,
    },
  },
  subscriptionRequest: {
    statistics: [
      "4730952-otScoreboardBasketball",
    ],
    lines: ["4730952-401", "4730953-401", "4731054-401"],
    bestLines: ["10"],
  },
  key: "LeagueTableEvents - lid: 5 ⭐",
  args: {
    lid: 5,
  },
};

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
// April 17, 2024
const DATE = 1713319200000;
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
const CATID = 10;

function App() {
  useLiveOddsSocket({
    onUpdate: (args) => {
      console.log(args, "args - update");
    },
    onReconnect: (args) => {
      console.log(args, "args - reconnect");
    },
    ...MOCK_SOCKET,
  });
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
                    <LinePredictionLoader
                      eventId={event.eid}
                      catid={CATID}
                      marketId={market}
                      partid={prediction?.partid}
                    >
                      {({ line }) => (
                        <pre>
                          {JSON.stringify({ line, prediction }, null, 2)}
                        </pre>
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
