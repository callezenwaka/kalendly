import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePopup } from '../../../src/react/components/DatePopup';
import { CalendarEvent } from '../../../src/core/types';

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 1,
    name: 'Team Meeting',
    date: '2024-01-15',
  },
  {
    id: 2,
    name: 'Project Review',
    date: '2024-01-15',
  },
];

describe('DatePopup Component', () => {
  describe('Rendering', () => {
    it('should render when visible with selectedDate', () => {
      render(
        <DatePopup
          isVisible={true}
          selectedDate={new Date('2024-01-15')}
          events={MOCK_EVENTS}
          scheduleDay="Monday 15"
          popupPositionClass="popup-center-bottom"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Monday 15')).toBeInTheDocument();
    });

    it('should not render when not visible', () => {
      const { container } = render(
        <DatePopup
          isVisible={false}
          selectedDate={new Date('2024-01-15')}
          events={MOCK_EVENTS}
          scheduleDay="Monday 15"
          popupPositionClass="popup-center-bottom"
          onClose={vi.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when selectedDate is null', () => {
      const { container } = render(
        <DatePopup
          isVisible={true}
          selectedDate={null}
          events={MOCK_EVENTS}
          scheduleDay="Monday 15"
          popupPositionClass="popup-center-bottom"
          onClose={vi.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render close button', () => {
      render(
        <DatePopup
          isVisible={true}
          selectedDate={new Date('2024-01-15')}
          events={MOCK_EVENTS}
          scheduleDay="Monday 15"
          popupPositionClass="popup-center-bottom"
          onClose={vi.fn()}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should apply popup position class', () => {
      const { container } = render(
        <DatePopup
          isVisible={true}
          selectedDate={new Date('2024-01-15')}
          events={MOCK_EVENTS}
          scheduleDay="Monday 15"
          popupPositionClass="popup-right"
          onClose={vi.fn()}
        />
      );

      const popup = container.querySelector('.date-popup');
      expect(popup).toHaveClass('popup-right');
    });
  });

  describe('Event Display', () => {
    it('should render events list', () => {
      render(
        <DatePopup
          isVisible={true}
          selectedDate={new Date('2024-01-15')}
          events={MOCK_EVENTS}
          scheduleDay="Monday 15"
          popupPositionClass="popup-center-bottom"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Project Review')).toBeInTheDocument();
    });

    it('should render no events message when events array is empty', () => {
      render(
        <DatePopup
          isVisible={true}
          selectedDate={new Date('2024-01-15')}
          events={[]}
          scheduleDay="Monday 15"
          popupPositionClass="popup-center-bottom"
          onClose={vi.fn()}
        />
      );

      expect(
        screen.getByText('No events scheduled for this day.')
      ).toBeInTheDocument();
    });

    it('should call onEventClick when event is clicked', () => {
      const onEventClick = vi.fn();

      render(
        <DatePopup
          isVisible={true}
          selectedDate={new Date('2024-01-15')}
          events={MOCK_EVENTS}
          scheduleDay="Monday 15"
          popupPositionClass="popup-center-bottom"
          onClose={vi.fn()}
          onEventClick={onEventClick}
        />
      );

      const eventElement = screen.getByText('Team Meeting');
      fireEvent.click(eventElement);

      expect(onEventClick).toHaveBeenCalledWith(MOCK_EVENTS[0]);
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();

      render(
        <DatePopup
          isVisible={true}
          selectedDate={new Date('2024-01-15')}
          events={MOCK_EVENTS}
          scheduleDay="Monday 15"
          popupPositionClass="popup-center-bottom"
          onClose={onClose}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Custom Renderers', () => {
    it('should use custom renderEvent', () => {
      const renderEvent = (event: CalendarEvent) => (
        <div data-testid={`custom-event-${event.id}`}>Custom: {event.name}</div>
      );

      render(
        <DatePopup
          isVisible={true}
          selectedDate={new Date('2024-01-15')}
          events={MOCK_EVENTS}
          scheduleDay="Monday 15"
          popupPositionClass="popup-center-bottom"
          onClose={vi.fn()}
          renderEvent={renderEvent}
        />
      );

      expect(screen.getByTestId('custom-event-1')).toBeInTheDocument();
      expect(screen.getByText('Custom: Team Meeting')).toBeInTheDocument();
    });

    it('should use custom renderNoEvents', () => {
      const renderNoEvents = () => (
        <div data-testid="custom-no-events">Custom no events message</div>
      );

      render(
        <DatePopup
          isVisible={true}
          selectedDate={new Date('2024-01-15')}
          events={[]}
          scheduleDay="Monday 15"
          popupPositionClass="popup-center-bottom"
          onClose={vi.fn()}
          renderNoEvents={renderNoEvents}
        />
      );

      expect(screen.getByTestId('custom-no-events')).toBeInTheDocument();
    });
  });

  describe('Event Item Styling', () => {
    it('should add clickable class when onEventClick is provided', () => {
      const { container } = render(
        <DatePopup
          isVisible={true}
          selectedDate={new Date('2024-01-15')}
          events={MOCK_EVENTS}
          scheduleDay="Monday 15"
          popupPositionClass="popup-center-bottom"
          onClose={vi.fn()}
          onEventClick={vi.fn()}
        />
      );

      const eventItems = container.querySelectorAll('.event--item');
      expect(eventItems[0]).toHaveClass('clickable');
    });

    it('should not add clickable class when onEventClick is not provided', () => {
      const { container } = render(
        <DatePopup
          isVisible={true}
          selectedDate={new Date('2024-01-15')}
          events={MOCK_EVENTS}
          scheduleDay="Monday 15"
          popupPositionClass="popup-center-bottom"
          onClose={vi.fn()}
        />
      );

      const eventItems = container.querySelectorAll('.event--item');
      expect(eventItems[0]).not.toHaveClass('clickable');
    });
  });
});
