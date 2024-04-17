import { gql } from "graphql-request";

export default ({ catid, eventId, marketId }) => gql`
  {
    bestLines(catid: ${catid}, eid: ${eventId}, mtid: ${marketId})
  }
`;
