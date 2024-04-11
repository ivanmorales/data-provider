import { gql } from "graphql-request";

export default (eid) => gql`
  {
    eventsV2(eid: ${eid}, hl: false) {
      events {
        eid
        participants {
          eid
          partid
          tr
          rot
          ih
          sppil
          source {
            ... on Player {
              pid
              fn
              lnam
            }
            ... on Team {
              tmid
              lid
              tmblid
              statisticsByGroups(
                statisticGroup: ["atsRecord"]
                identities: ["0"]
              ) {
                ent
                grp
                stat
                val
                idty
                entrid
                partid
              }
            }
          }
        }
      }
    }
  }
`;
