import { useLiveOddsSocket } from "../sockets/useWebSocket";

const MOCK_SOCKET = {
  maxSequences: {
    currentLines: {
      maxSequence: 11804170498,
    },
  },
  key: "LeagueTableEvents - lid: 5 ⭐",
  args: {
    lid: 5,
  },
};

const _buildSubscriptionRequest = (events, markets, catid) => {
  const lines = events.reduce((acc, { eid }) => {
    const byMarket = markets.map((marketId) => `${eid}-${marketId}`)

    acc = acc.concat(byMarket)

    return acc
  }, [])

  return {
    statistics: [
      "4730952-otScoreboardBasketball",
    ],
    lines,
    bestLines: [`${catid}`],
  }
}

export const WebSocketLoader = ({
  children,
  events,
  markets,
  catid,
}) => {
  useLiveOddsSocket({
    ...MOCK_SOCKET,
    onUpdate: (args) => {
      console.log(args, "args - update");
    },
    onReconnect: (args) => {
      console.log(args, "args - reconnect");
    },
    subscriptionRequest: _buildSubscriptionRequest(events, markets, catid),
  });

  return children
};
