import { getSubscriptionConfig } from "./constants";

import Client from "socket.io-client";
import {
  set,
  get,
  maxBy,
  mapValues,
  flattenDeep,
  isEmpty,
  keys,
  values,
} from "lodash";
import { useMemo, useRef, useEffect, useCallback, useState } from "react";

const LIVE_ODDS_URI = import.meta.env.VITE_LIVE_ODDS_URI;
const MAX_TIME_FOR_RECONNECT = 300000; // configuration.maxTimeForExecuteReconnect
const DISPATCH_INTERVAL = 100;
const MAX_LOGS = 100;
const CLICKS_LOGS_ACTIVATOR = 20;

const toArray = () => [];

const _logsHistory = [];

if (typeof window === "object") {
  let ctrl = false;

  let shift = false;

  window.__SHOW_SOCKET_LOGS__ = true;

  document.addEventListener("keydown", (e) => {
    if (!ctrl && e.key === "Control") {
      ctrl = true;

      return;
    }
    if (!shift && e.key === "Shift") {
      shift = true;

      return;
    }

    const shouldLogs = ctrl && shift && e.key.toLowerCase() === "s";

    if (!shouldLogs) return;
    e.preventDefault();

    window.__SHOW_SOCKET_LOGS__ = true;
    // eslint-disable-next-line no-console
    console.info("SEND THIS:", btoa(encodeURI(JSON.stringify(_logsHistory))));
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "Control") ctrl = false;
    if (e.key === "Shift") shift = false;
  });
}

const _log = (key, funcName, colorFunc, ...args) => {
  const keysAllowed =
    (typeof window === "object" && window.__SOCKET_KEYS__) || [];
  const shouldLog =
    isEmpty(keysAllowed) || keysAllowed.includes((x) => x === key);

  if (!shouldLog) return;
  //   const time = moment().format('HH:mm:ss')

  if (_logsHistory.length > MAX_LOGS) _logsHistory.shift();
  //   _logsHistory.push({ time, key, funcName, colorFunc, args })
  if (!window.__SHOW_SOCKET_LOGS__) return;
  // eslint-disable-next-line no-console
  console.info(
    `%c${new Date().toLocaleTimeString("en-US")}%c [${key} => %c${funcName}%c]`,
    "color: gray",
    "color: gray",
    `color: ${colorFunc}`,
    "color: gray",
    ...args
  );
};

const _getFlatSocket = ({
  connected,
  disconnected,
  id,
  subs,
  _callbacks,
  io,
} = {}) => ({
  connected,
  disconnected,
  id,
  subs: subs?.length || 0,
  _callbacks: keys(_callbacks),
  io: {
    autoConnect: io?.autoConnect,
    opts: io?.opts,
  },
});

export const useWebSocketLogReport = () => {
  const [message, setMessage] = useState();
  const counterRef = useRef(0);

  const onClick = useCallback(() => {
    counterRef.current += 1;

    if (
      window.__SHOW_SOCKET_LOGS__ &&
      counterRef.current > CLICKS_LOGS_ACTIVATOR
    ) {
      setMessage(btoa(encodeURI(JSON.stringify(_logsHistory))));
    }
  }, []);

  const onCleanCounter = useCallback(() => {
    counterRef.current = 0;
    setMessage(undefined);
  }, []);

  return { message, onClick, onCleanCounter };
};

/**
 * Takes a group of channels (e.g `{ eid: ["4143439"] }`) and confirms that the channels are properly formatted
 *
 * Regex examples:
 *  * "4143439" ✔
 *  * "4143439-401" ✔
 *  * "-401" ✖
 *  * "4143439-" ✖
 *  * "-" ✖
 *  * "" ✖
 */
const isChannelsValid = (channelsGroups) => {
  const isValid =
    !isEmpty(channelsGroups) &&
    values(channelsGroups).every(
      (channels) =>
        !isEmpty(channels) &&
        channels.every((channel) => /^(\w+-\w+|\w+)$/.test(channel))
    );

  return isValid;
};

const isMaxSequencesValid = (maxSequences) => {
  const isValid =
    !isEmpty(maxSequences) &&
    values(maxSequences).every((maxSequence) => maxSequence?.maxSequence > 0);

  return isValid;
};

const isTimeExceeded = ({ current }) =>
  Date.now() - current > MAX_TIME_FOR_RECONNECT;

// Accumulate iterable data.
const accumulator = ({ oldKey, oldData }, { newKey, newData }, value) =>
  get(newData, newKey, []).reduce(
    (result, current) => set(result, current, value),
    oldData[oldKey || newKey]
  );

const useSocketRef = (uri, args) => {
  const socketRef = useRef(null);

  if (!socketRef.current) socketRef.current = new Client(uri, args);

  return socketRef.current;
};

const useWebSocket = (
  { uri, args },
  { key, rooms, channels, maxSequences, readyToUseSocket },
  { onUpdate, onReconnect }
) => {
  // Container of accumulated data to update from time to time.
  const updateQueue = useRef({});
  // Subscriptions list.
  const subscriptions = useRef([]);
  // MaxSequences accumulator.
  const allMaxSequences = useRef({});
  // Some subscriptions have different mapping, this object lists them.
  const deepSubscriptions = useRef({});
  // The socket.
  const socket = useSocketRef(uri, args);
  // The disconnection date.
  const disconnectionDate = useRef(Date.now());

  // Accumulate the MaxSequences.
  const setMaxSequences = useCallback((newMaxSequences) => {
    allMaxSequences.current = Object.keys(newMaxSequences).reduce(
      (result, sequence) => ({
        ...result,
        [sequence]: newMaxSequences[sequence],
      }),
      allMaxSequences.current
    );
  }, []);

  // The callback executed when subscribed.
  const onSubscribe = useCallback(
    (newData) => {
      const callbackHasError = Boolean(newData?.error);

      _log(
        key,
        `Callback${callbackHasError ? " Error" : ""}`,
        callbackHasError ? "orange" : "#0078f0",
        { newData }
      );
      const { newUpdate, newMaxSequences } = subscriptions.current.reduce(
        (result, subscription) => {
          const update = get(newData, [subscription, "data", subscription], []);
          const maxSequence = get(
            newData,
            [subscription, "data", "maxSequence"],
            0
          );

          const safeUpdate = get(
            deepSubscriptions,
            ["current", subscription],
            false
          )
            ? flattenDeep(update.map((change) => change[subscription]))
            : update;

          return {
            newUpdate: { ...result.newUpdate, [subscription]: safeUpdate },
            newMaxSequences: {
              ...result.newMaxSequences,
              [subscription]: { maxSequence },
            },
          };
        },
        { newUpdate: {}, newMaxSequences: {} }
      );

      onUpdate(newUpdate);
      setMaxSequences(newMaxSequences);
    },
    [onUpdate]
  );

  // Subscribe the socket to the current channels and declare the events by subscription.
  const subscribe = useCallback(() => {
    const {
      updateQueue: newQueue,
      subscriptions: newSubs,
      deepSubscriptions: newDeep,
    } = rooms.reduce(
      (result, room) => ({
        subscriptions: accumulator(
          { oldData: result },
          { newKey: "subscriptions", newData: room },
          true
        ),
        deepSubscriptions: accumulator(
          { oldData: result },
          { newKey: "deepSubscriptions", newData: room },
          true
        ),
        updateQueue: accumulator(
          { oldKey: "updateQueue", oldData: result },
          { newKey: "subscriptions", newData: room },
          []
        ),
      }),
      { updateQueue: {}, subscriptions: {}, deepSubscriptions: {} }
    );

    updateQueue.current = newQueue;
    deepSubscriptions.current = newDeep;
    allMaxSequences.current = maxSequences;
    subscriptions.current = Object.keys(newSubs);

    const areChannelsValid = isChannelsValid(channels);
    const areMaxSequencesValid = isMaxSequencesValid(maxSequences);
    const areRoomsValid = !isEmpty(rooms);
    const areCallbackValid = Boolean(onSubscribe);

    const shouldConnect =
      areChannelsValid &&
      areMaxSequencesValid &&
      areRoomsValid &&
      areCallbackValid &&
      readyToUseSocket;

    if (!shouldConnect) {
      _log(
        key,
        "shouldConnect",
        "orange",
        {
          shouldConnect,
          areChannelsValid,
          areMaxSequencesValid,
          areRoomsValid,
          areCallbackValid,
        },
        channels,
        rooms,
        maxSequences
      );

      return;
    }

    socket.removeAllListeners();
    socket.on("reconnect", () => {
      const timeExceeded = isTimeExceeded(disconnectionDate);

      _log(key, "Reconnect", "#b0e825", {
        disconnectionDate: disconnectionDate.current,
        timeExceeded,
      });
      onReconnect(timeExceeded);

      if (!timeExceeded) subscribe();
    });
    socket.on("disconnect", () => {
      disconnectionDate.current = Date.now();
      _log(key, "Disconnect", "red", {
        disconnectionDate: disconnectionDate.current,
      });
    });
    subscriptions.current.forEach((subscription) => {
      socket.on(subscription, (data) => {
        const updates =
          (data &&
            (deepSubscriptions.current[subscription]
              ? get(data, subscription, [])
              : [data])) ||
          [];

        updateQueue.current = set(updateQueue.current, subscription, [
          ...get(updateQueue.current, subscription, []),
          ...updates,
        ]);
      });
    });

    _log(key, "Join", "#b0e825", {
      channels,
      rooms,
      maxSequences,
      subscriptions,
    });

    socket.emit("join-event", channels, rooms, maxSequences, onSubscribe);
  }, [
    key,
    rooms,
    channels,
    maxSequences,
    readyToUseSocket,
    onReconnect,
    onSubscribe,
  ]);

  // Unsubscribe the socket from the current channels.
  const unSubscribe = useCallback(() => {
    const shouldConnect =
      !isChannelsValid(channels) &&
      !isEmpty(rooms) &&
      !isMaxSequencesValid(maxSequences);

    if (!shouldConnect) return;
    _log(key, "Leave", "#FF4539", { channels, rooms });

    socket.emit("leave-events", channels, rooms);
  }, [key, rooms, channels, maxSequences]);

  useEffect(() => {
    _log(key, "Open", "#27ae60", { socket: _getFlatSocket(socket) });
    socket.open();
  }, []);

  // Contains the proper steps for a total reconnection.
  const connect = useCallback(() => {
    _log(key, "Open", "#27ae60", { socket: _getFlatSocket(socket) });
    socket.open();
    const timeExceeded = isTimeExceeded(disconnectionDate);

    onReconnect(timeExceeded);

    if (!timeExceeded) subscribe();
  }, [subscribe]);

  // Contains the proper steps for a total disconnection.
  const disconnect = useCallback(() => {
    _log(key, "Close", "red", { socket: _getFlatSocket(socket) });
    socket.close();
  }, []);

  // If the rooms, channels or the sequences change, the socket must
  // unsubscribe from the previous channels and subscribe to the new ones.
  // Note: The unsubscribe function must use the old variables, not the new ones, verify this!
  useEffect(() => {
    subscribe(); // Join

    return unSubscribe; // Leave
  }, [key, rooms, channels, maxSequences]);

  useEffect(
    () => () => {
      _log(key, "Close", "red", { socket: _getFlatSocket(socket) });
      socket.close();
    },
    []
  );

  // A setInterval is used to send the information saved
  // through the sockets to the update callback every so often.
  // Note: The above interval must be canceled if the update callback changes or the component is unmounted.
  useEffect(() => {
    const interval = setInterval(() => {
      const shouldUpdate = flattenDeep(
        Object.values(updateQueue.current)
      ).length;

      if (shouldUpdate) {
        const newMaxSequences = mapValues(updateQueue.current, (updates) => ({
          maxSequence: Number(get(maxBy(updates, "sequence"), "sequence", 0)),
        }));

        _log(key, "Update", "#0078f0", {
          updateQueue: updateQueue.current,
          newMaxSequences,
        });
        onUpdate(updateQueue.current);
        setMaxSequences(newMaxSequences);

        updateQueue.current = mapValues(updateQueue.current, toArray);
      }
    }, DISPATCH_INTERVAL);

    return () => clearInterval(interval);
  }, [onUpdate]);

  return {
    connect,
    subscribe,
    disconnect,
    unSubscribe,
  };
};

export const useLiveOddsSocket = ({
  key,
  onUpdate,
  onReconnect,
  maxSequences,
  readyToUseSocket = true,
  subscriptionRequest,
}) => {
  // Rooms and subscriptions.
  const { rooms, subscriptions } = useMemo(() => {
    const newSubscriptions = Object.keys(subscriptionRequest).filter((type) =>
      getSubscriptionConfig({ type })
    );
    const newRooms = newSubscriptions.map((type) =>
      getSubscriptionConfig({ type })
    );

    return { rooms: newRooms, subscriptions: newSubscriptions };
  }, [subscriptionRequest]);

  // Channels.
  const channels = useMemo(
    () =>
      subscriptions.reduce((result, type) => {
        const room = getSubscriptionConfig({ type });
        const roomKey = room.keys.join("-");

        return { ...result, [roomKey]: subscriptionRequest[type] };
      }, {}),
    [subscriptions]
  );

  // Connect and disconnect handlers.
  const { connect, disconnect } = useWebSocket(
    {
      uri: LIVE_ODDS_URI,
      args: {
        autoConnect: false,
        query: {
          token: key,
        },
      },
    },
    { key, rooms, channels, maxSequences, readyToUseSocket },
    { onUpdate, onReconnect }
  );

  useEffect(() => {
    let hidden;

    let visibilityChange;

    const handleVisibilityChange = () => {
      if (document[hidden]) {
        disconnect();
      } else {
        connect();
      }
    };

    if (typeof document !== "undefined") {
      if (typeof document.hidden !== "undefined") {
        hidden = "hidden";
        visibilityChange = "visibilitychange";
      } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
      } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
      }

      if (
        typeof document.addEventListener === "undefined" ||
        hidden === undefined
      ) {
        // eslint-disable-next-line no-console
        console.info("Page Visibility API not supported.");
      } else {
        document.addEventListener(
          visibilityChange,
          handleVisibilityChange,
          false
        );

        return () =>
          document.removeEventListener(
            visibilityChange,
            handleVisibilityChange,
            false
          );
      }
    }

    return undefined;
  }, [key, connect, disconnect]);
};

export default useWebSocket;
