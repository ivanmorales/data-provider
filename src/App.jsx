import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { QueryClient } from "@tanstack/react-query";
import { DataProvider } from "./DataProvider";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

import { compress, decompress } from "lz-string";
import { EventLoader } from "./DataProvider/EventLoader";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 } },
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

const newMarkets = [1608, 1609, 1613, 1614, 1615];

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

function App() {
  const [markets, setMarkets] = useState([1607]);

  return (
    <DataProvider client={queryClient}>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button
          onClick={() =>
            setMarkets((markets) => [...markets, newMarkets.pop()])
          }
        >
          Fetch new market
        </button>
        {markets.map((marketId) => (
          <EventLoader eventId={4710564} marketId={marketId} key={marketId}>
            {({ event }) => (
              <>
                <p style={{ textAlign: "left" }}>
                  {event.eid} - {marketId}
                </p>
                <pre style={{ textAlign: "left" }}>
                  {JSON.stringify(event.marketPrediction, null, 2)}
                </pre>
              </>
            )}
          </EventLoader>
        ))}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <EventLoader eventId={4710565}>
        {({ event }) => <h4>{event.eid}</h4>}
      </EventLoader>
    </DataProvider>
  );
}

export default App;