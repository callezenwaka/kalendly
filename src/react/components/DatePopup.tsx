import React from 'react';
import { DatePopupProps } from '../types';
import { formatTimeRange, formatAttendees } from '../../core/utils';

const PriorityBadge: React.FC<{ priority?: string }> = ({ priority }) => {
  if (!priority) return null;

  const priorityConfig = {
    high: { label: 'HIGH', className: 'badge priority-high' },
    medium: { label: 'MEDIUM', className: 'badge priority-medium' },
    low: { label: 'LOW', className: 'badge priority-low' },
  };

  const config = priorityConfig[priority as keyof typeof priorityConfig];
  if (!config) return null;

  return <span className={config.className}>{config.label}</span>;
};

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  if (!status || status === 'scheduled') return null;

  const statusConfig = {
    completed: { label: 'COMPLETED', className: 'badge status-completed' },
    cancelled: { label: 'CANCELLED', className: 'badge status-cancelled' },
    tentative: { label: 'TENTATIVE', className: 'badge status-tentative' },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return <span className={config.className}>{config.label}</span>;
};

const CategoryBadge: React.FC<{ category?: string }> = ({ category }) => {
  if (!category) return null;

  const categoryConfig = {
    work: { label: 'WORK', className: 'badge category-work' },
    personal: { label: 'PERSONAL', className: 'badge category-personal' },
    meeting: { label: 'MEETING', className: 'badge category-meeting' },
    deadline: { label: 'DEADLINE', className: 'badge category-deadline' },
    appointment: {
      label: 'APPOINTMENT',
      className: 'badge category-appointment',
    },
    other: { label: 'OTHER', className: 'badge category-other' },
  };

  const config = categoryConfig[category as keyof typeof categoryConfig];
  if (!config) return null;

  return <span className={config.className}>{config.label}</span>;
};

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

  const handleEventClick = (event: DatePopupProps['events'][number]) => {
    onEventClick?.(event);
  };

  const showScrollHint = events.length > 3;

  const defaultRenderEvent = (event: DatePopupProps['events'][number]) => {
    const timeRange = formatTimeRange(event);
    const attendeesList = formatAttendees(event.attendees);

    return (
      <div
        key={event.id || event.name}
        className={`event-card${onEventClick ? ' clickable' : ''}`}
        onClick={() => handleEventClick(event)}
        style={{
          borderLeftColor: event.color || undefined,
        }}
      >
        <div className="event-header">
          <div className="event-title">{event.name}</div>
          <div className="event-badges">
            <CategoryBadge category={event.category} />
            <PriorityBadge priority={event.priority} />
            <StatusBadge status={event.status} />
          </div>
        </div>

        {timeRange && (
          <div className="event-time">
            <span className="event-time-label">Time:</span>
            <span className="event-time-value">{timeRange}</span>
          </div>
        )}

        {event.description && (
          <div className="event-description">{event.description}</div>
        )}

        {event.location && (
          <div className="event-time">
            <span className="event-time-label">Location:</span>
            <span className="event-time-value">{event.location}</span>
          </div>
        )}

        {attendeesList && (
          <div className="event-time">
            <span className="event-time-label">Attendees:</span>
            <span className="event-time-value">{attendeesList}</span>
          </div>
        )}

        {event.organizer && (
          <div className="event-time">
            <span className="event-time-label">Organizer:</span>
            <span className="event-time-value">{event.organizer}</span>
          </div>
        )}

        {event.notes && (
          <div className="event-time">
            <span className="event-time-label">Notes:</span>
            <span className="event-time-value">{event.notes}</span>
          </div>
        )}

        {event.url && (
          <div className="event-time">
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="event-link"
              onClick={e => e.stopPropagation()}
            >
              View Details →
            </a>
          </div>
        )}

        {event.tags && event.tags.length > 0 && (
          <div className="event-tags">
            {event.tags.map((tag: string, idx: number) => (
              <span key={idx} className="event-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const defaultRenderNoEvents = () => (
    <div className="no-events-message">No events scheduled for this day.</div>
  );

  return (
    <div className={`date-popup ${popupPositionClass}`}>
      <div className="popup-header">
        <h2>{scheduleDay}</h2>
        <button
          type="button"
          className="popup-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {showScrollHint && (
        <div className="scroll-hint">↓ Scroll to see more events ↓</div>
      )}

      <div className="events-container">
        {events.length > 0
          ? events.map(event =>
              renderEvent ? (
                <div
                  key={event.id || event.name}
                  className={`event-card${onEventClick ? ' clickable' : ''}`}
                  onClick={() => handleEventClick(event)}
                >
                  {renderEvent(event)}
                </div>
              ) : (
                defaultRenderEvent(event)
              )
            )
          : renderNoEvents
            ? renderNoEvents()
            : defaultRenderNoEvents()}
      </div>
    </div>
  );
};
