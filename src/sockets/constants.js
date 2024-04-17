export const SUBSCRIPTION_TYPE = Object.freeze({
  EVENT: "event",
  SCORES: "scores",
  LINES: "lines",
  BEST_LINES: "bestLines",
  STATISTICS: "statistics",
  EVENT_ROSTER: "eventRoster",
});

export const SUBSCRIPTIONS_CONFIG = Object.freeze({
  [SUBSCRIPTION_TYPE.EVENT]: {
    keys: ["eid"],
    subscriptions: ["events"],
  },
  [SUBSCRIPTION_TYPE.SCORES]: {
    keys: ["eid"],
    subscriptions: ["scores"],
  },
  [SUBSCRIPTION_TYPE.BEST_LINES]: {
    keys: ["cid"],
    subscriptions: ["bestLines"],
    deepSubscriptions: ["bestLines"],
  },
  [SUBSCRIPTION_TYPE.STATISTICS]: {
    keys: ["eid", "stgnam"],
    subscriptions: ["statisticsV2"],
  },
  [SUBSCRIPTION_TYPE.EVENT_ROSTER]: {
    keys: ["eid"],
    subscriptions: ["eventRoster"],
  },
});

export const getSubscriptionConfig = ({ type }) => {
  if (type === SUBSCRIPTION_TYPE.LINES) {
    return {
      keys: ["eid", "mtid"],
      subscriptions: ["consensus", "currentLines", "liveLines"],
    };
  }

  return SUBSCRIPTIONS_CONFIG[type];
};
