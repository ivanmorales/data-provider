import byLeague from "../queries/byLeague";

import { buildKey, useOddsService } from "./useOddsService";
import { useFirebaseService } from "./useFirebaseService";
import { Loading } from "../component/Loading";
import byLine from "../queries/byLine";

export const LeagueEventLoader = ({
  children,
  fallback = <Loading />,
  ...props
}) => {
  if (typeof children !== "function") {
    console.error(`{children} must be passed as a function`);
    return;
  }
  const { leagueId, date, eventStatuses, markets, catid } = props;

  const keys = ["league", leagueId, date];
  const keysByLine = ["linesByleague", leagueId, date];

  const query = byLeague({
    lid: leagueId,
    fastForward: true,
    paid: "[101,106,113,102,98,109,115,122,99]",
    eventStatuses: JSON.stringify(eventStatuses),
    date: date,
    hoursRange: 24,
    fastForwardOffset: -7,
    mtid: JSON.stringify([
      0, 215, 1625, 1577, 583, 1578, 339, 1579, 584, 1580, 1581, 1626, 1611,
      1545, 1612, 559, 1582, 1583, 1584, 1585, 1586, 1587, 1588, 1589, 1590,
      1591, 1592, 1593, 1594, 1595, 1596, 1597, 1598, 1599, 1600, 1601, 1602,
      1603, 1604, 1605, 1622, 1549, 1550, 1551, 1552, 1553, 1554, 1555, 1556,
      1557, 1558, 1559, 1560, 1561, 1562, 1563, 1564, 1565, 1566, 1567, 1568,
      1569, 1570, 1571, 1572, 1573, 1574, 1621,
    ]),
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

  const eids = oddsResult.data?.eventsByDateNew.events.map(({ eid }) => eid);

  const queryByLine = byLine({
    catid,
    eventId: JSON.stringify(eids),
    marketId: JSON.stringify(markets),
  });
  const oddsResultByLine = useOddsService(keysByLine, {
    query: queryByLine,
    variables: {
      enabled: Boolean(eids && eids.length && markets && markets.length),
    },
    onSuccess(data, cacheData) {
      if (!data.bestLines) return;

      const groupedByEventAndMarket = data.bestLines.reduce((acc, line) => {
        const { eid, mtid } = line || {};

        if (!eid || !mtid) return acc;

        const key = `${eid}-${mtid}`;

        if (!acc[key]) acc[key] = [];

        acc[key].push(line);

        return acc;
      }, {});

      Object.keys(groupedByEventAndMarket).map((key) => {
        const [eid, mtid] = key.split('-')
        const queryKey = buildKey(["lineByEvent", `${catid}`, `${eid}`, `${mtid}`]);
        cacheData(queryKey, { bestLines: groupedByEventAndMarket[key] });
      })

      return data.bestLines;
    },
  });

  if (oddsResultByLine.isLoading || oddsResult.isLoading) {
    return fallback;
  }

  const events = oddsResult.data?.eventsByDateNew.events;

  return children({ events });
};
