import { gql } from "graphql-request";

export default ({
  hoursRange,
  date,
  paid,
  lid,
  fastForward,
  fastForwardOffset,
  mtid,
}) => gql`
{
  eventsByDateNew(lid: ${lid}, startDate: ${date}, hoursRange: ${hoursRange}, mtid: ${mtid}, sort: {by: ["dt", "lid", "des"], order: ASC}, fastForwardOffset: ${fastForwardOffset}, fastForward: ${fastForward}, es: ["scheduled", "delayed"], showEmptyEvents: false, onlyRanked: false, paid: ${paid}) {
    events {
      eid
      des
      lid
      tvs
      dt
      es
      spid
      ic
      zcode
      att
      st
      rft
      fo
      cit
      sta
      ven
      slg
      seid
      cou
      cov
      tl
      writeingame
      sequence
      marketCounter
      eventGroup {
        egid
        nam
        parentid
        parentname
      }
      participants {
        eid
        partid
        tr
        rot
        ih
        sppil
        partbeid
        isFavorite
        startingPitcher {
          fn
          lnam
        }
        source {
          ... on Player {
            pid
            fn
            lnam
            hsurl
          }
          ... on Team {
            tmid
            lid
            tmblid
            imageurl
            nam
            nn
            sn
            abbr
            cit
            senam
            iv
            slg
            statisticsByGroups(statisticGroup: ["atsRecord"], identities: ["0"]) {
              ent
              grp
              stat
              val
              idty
              entrid
            }
            socialNetworks {
              account
              network
            }
          }
          ... on ParticipantGroup {
            partgid
            nam
            lid
            participants {
              eid
              partid
              tr
              psid
              ih
              rot
              source {
                ... on Player {
                  pid
                  fn
                  lnam
                  hsurl
                }
                ... on Team {
                  tmid
                  lid
                  nam
                  nn
                  sn
                  abbr
                  cit
                  slg
                }
              }
            }
          }
        }
      }
      scores {
        eid
        partid
        pn
        val
        sequence
      }
      statisticsByGroups(statisticGroup: ["otScoreboardBasketball", "odLeaguePage", "EventSeriesStats"]) {
        eid
        entrid
        ent
        grp
        val
        stat
        idty
        partid
        sequence
        pfn
        pln
        pid
      }
      marketTypes {
        mtid
        spid
        nam
        des
        settings {
          layout
          format
        }
      }
      lat
      lon
    }
  }
  maxSequences {
    eventsMaxSequence
    scoresMaxSequence
    linesMaxSequence
    statisticsMaxSequence
    statisticsByGroupsMaxSequence
    consensusMaxSequence
    playsMaxSequence
  }
}
`;
