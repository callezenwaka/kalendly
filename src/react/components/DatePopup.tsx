import React from 'react';
import { DatePopupProps } from '../types';

export const DatePopup: React.FC<DatePopupProps> = ({
  isVisible,
  selectedDate,
  events,
  scheduleDay,
  popupPositionClass,
  onEventClick,
  onClose,
  renderEvent,
  renderNoEvents,
}) => {
  if (!isVisible || !selectedDate) return null;

  const handleEventClick = (event: any) => {
    onEventClick?.(event);
  };

  const defaultRenderEvent = (event: any) => (
    <li
      key={event.id || event.name}
      className={`event--item${onEventClick ? ' clickable' : ''}`}
      onClick={() => handleEventClick(event)}
    >
      {event.name}
    </li>
  );

  const defaultRenderNoEvents = () => (
    <div className="no-events-message">No events scheduled for this day.</div>
  );

  return (
    <div className={`date-popup ${popupPositionClass}`}>
      <button
        type="button"
        className="popup-close"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>
      <div className="schedule--wrapper">
        <div className="schedule--block">
          <h2 className="schedule--day">{scheduleDay}</h2>
        </div>

        {events.length > 0 ? (
          <div className="event--wrapper">
            <ul>
              {events.map(event =>
                renderEvent ? (
                  <li
                    key={event.id || event.name}
                    className={`event--item${onEventClick ? ' clickable' : ''}`}
                    onClick={() => handleEventClick(event)}
                  >
                    {renderEvent(event)}
                  </li>
                ) : (
                  defaultRenderEvent(event)
                )
              )}
            </ul>
          </div>
        ) : renderNoEvents ? (
          renderNoEvents()
        ) : (
          defaultRenderNoEvents()
        )}
      </div>
    </div>
  );
};
