export const EventCard = ({ children, event }) => {
  return (
    <div
      style={{
        border: "1px solid #FFF000",
      }}
    >
      {/* Display Participants */}
      <div>
        {event.eid} - {event.des}
      </div>
      {/* Display Prediction */}
      {children}
    </div>
  );
};
