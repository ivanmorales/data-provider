import { useState, useCallback, useMemo } from "react";
import { useLiveOddsSocket } from "../sockets/useWebSocket";
import LinesContext from "../context/lines";

const MOCK_SOCKET = {
  maxSequences: {
    currentLines: {
      maxSequence: 11805593283,
    },
  },
  key: "LeagueTableEvents - lid: 5 ⭐",
  args: {
    lid: 5,
  },
};

const _buildSubscriptionRequest = (events, markets, catid) => {
  const lines = events.reduce((acc, { eid }) => {
    const byMarket = markets.map((marketId) => `${eid}-${marketId}`);

    acc = acc.concat(byMarket);

    return acc;
  }, []);

  return {
    statistics: ["4730952-otScoreboardBasketball"],
    lines,
    bestLines: [`${catid}`],
  };
};

export const WebSocketLoader = ({ children, events, markets, catid }) => {
  const [data, setData] = useState({});

  const onUpdate = useCallback((updates) => {
    const { bestLines } = updates || {};

    setData((oldLines) => {
      const newData = { ...oldLines };

      bestLines.forEach((line) => {
        const { mtid, eid } = line;

        console.log(`${eid}-${mtid} Best Line Updated!!`)

        newData[`${eid}-${mtid}`] = line;
      });

      return newData
    })
  }, []);

  const onReconnect = useCallback((args) => {
    console.log(args, "args - reconnect");
  });

  const subscriptionRequest = useMemo(() => {
    return _buildSubscriptionRequest(events, markets, catid)
  }, [catid])

  useLiveOddsSocket({
    ...MOCK_SOCKET,
    onUpdate,
    onReconnect,
    subscriptionRequest,
  });

  return <LinesContext.Provider value={data}>{children}</LinesContext.Provider>;
};
