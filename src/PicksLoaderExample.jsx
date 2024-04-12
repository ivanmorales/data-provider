<PicksLoader league={leagueId} markets={[100,101,102]} date={date} type="league_picks">
 {({events}) => (
  {events.map(event => (
    <EventPredictionLoader eventId="{event}" market={marketId}>
      {({event}) => (
        <EventCard event={event}>
          <Header slot="header">
            <Date date={event.date} />
          </Header>
          <Participants slot="participants">
            {event.participants.map(participant => (
              <Participant participant={participant} />
            ))}
          </Participants>
          <EventPredictions>
            {({ prediction }) => (

            )}
          </EventPredictions>
        </EventCard>
      )}
    </EventPredictionLoader>
  )}
)}
</PicksLoader>