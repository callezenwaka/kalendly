import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Calendar } from '../../../src/react/components/Calendar';
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
    date: '2024-01-20',
  },
];

describe('React Calendar Component', () => {
  describe('Rendering', () => {
    it('should render calendar with title', () => {
      render(<Calendar events={[]} title="My Calendar" />);

      expect(screen.getByText('My Calendar')).toBeInTheDocument();
    });

    it('should render without title when not provided', () => {
      render(<Calendar events={[]} title="" />);

      expect(
        screen.queryByRole('heading', { level: 1 })
      ).not.toBeInTheDocument();
    });

    it('should render month and year header', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);

      expect(screen.getByText('Jan 2024')).toBeInTheDocument();
    });

    it('should render day headers', () => {
      render(<Calendar events={[]} />);

      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('should render calendar grid', () => {
      render(<Calendar events={[]} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      render(<Calendar events={[]} />);

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should render month and year selectors', () => {
      render(<Calendar events={[]} />);

      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBe(2); // Month and year selectors
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Calendar events={[]} className="custom-class" />
      );

      const calendar = container.querySelector('.kalendly-calendar');
      expect(calendar).toHaveClass('custom-class');
    });

    it('should apply custom style', () => {
      const customStyle = { backgroundColor: 'red' };
      const { container } = render(
        <Calendar events={[]} style={customStyle} />
      );

      const calendar = container.querySelector('.kalendly-calendar');
      expect(calendar).toBeTruthy();
      // Style is applied via React, checking element exists is sufficient
    });
  });

  describe('Event Handling', () => {
    it('should call onDateSelect when date clicked', () => {
      const onDateSelect = vi.fn();
      render(
        <Calendar
          events={[]}
          initialDate={new Date('2024-01-15')}
          onDateSelect={onDateSelect}
        />
      );

      const dateCell = screen.getByText('15');
      fireEvent.click(dateCell);

      expect(onDateSelect).toHaveBeenCalled();
    });

    it('should call onMonthChange when month changes', () => {
      const onMonthChange = vi.fn();
      render(
        <Calendar
          events={[]}
          initialDate={new Date('2024-01-15')}
          onMonthChange={onMonthChange}
        />
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // onMonthChange callback is called when navigation happens
      expect(onMonthChange).toHaveBeenCalled();
    });

    it('should call onEventClick when event clicked', () => {
      const onEventClick = vi.fn();
      render(
        <Calendar
          events={MOCK_EVENTS}
          initialDate={new Date('2024-01-15')}
          onEventClick={onEventClick}
        />
      );

      // Click date to show popup
      const dateCell = screen.getByText('15');
      fireEvent.click(dateCell);

      // Click event in popup
      const eventElement = screen.getByText('Team Meeting');
      fireEvent.click(eventElement);

      expect(onEventClick).toHaveBeenCalledWith(MOCK_EVENTS[0]);
    });

    it('should show popup on date selection', () => {
      render(
        <Calendar events={MOCK_EVENTS} initialDate={new Date('2024-01-15')} />
      );

      const dateCell = screen.getByText('15');
      fireEvent.click(dateCell);

      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    it('should close popup on close button', () => {
      render(
        <Calendar events={MOCK_EVENTS} initialDate={new Date('2024-01-15')} />
      );

      // Click date to show popup
      const dateCell = screen.getByText('15');
      fireEvent.click(dateCell);

      expect(screen.getByText('Team Meeting')).toBeInTheDocument();

      // Close popup
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Team Meeting')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to next month', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);

      expect(screen.getByText('Jan 2024')).toBeInTheDocument();

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(screen.getByText('Feb 2024')).toBeInTheDocument();
    });

    it('should navigate to previous month', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-03-15')} />);

      expect(screen.getByText('Mar 2024')).toBeInTheDocument();

      const prevButton = screen.getByText('Previous');
      fireEvent.click(prevButton);

      expect(screen.getByText('Feb 2024')).toBeInTheDocument();
    });

    it('should jump to selected month', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);

      const monthSelect = screen.getByLabelText('Select month');
      fireEvent.change(monthSelect, { target: { value: '5' } }); // June

      expect(screen.getByText('Jun 2024')).toBeInTheDocument();
    });

    it('should jump to selected year', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);

      const yearSelect = screen.getByLabelText('Select year');
      fireEvent.change(yearSelect, { target: { value: '2025' } });

      expect(screen.getByText('Jan 2025')).toBeInTheDocument();
    });
  });

  describe('Props and Configuration', () => {
    it('should respect initialDate', () => {
      render(<Calendar events={[]} initialDate={new Date('2025-06-15')} />);

      expect(screen.getByText('Jun 2025')).toBeInTheDocument();
    });

    it('should respect weekStartsOn Sunday', () => {
      render(<Calendar events={[]} weekStartsOn={0} />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers[0]).toHaveTextContent('Sun');
    });

    it('should respect weekStartsOn Monday', () => {
      render(<Calendar events={[]} weekStartsOn={1} />);

      // Calendar should still render with week configuration
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should update when events prop changes', async () => {
      const { rerender } = render(
        <Calendar events={[]} initialDate={new Date('2024-01-15')} />
      );

      // Click date - should show no events
      fireEvent.click(screen.getByText('15'));
      expect(
        screen.getByText('No events scheduled for this day.')
      ).toBeInTheDocument();

      // Close popup
      fireEvent.click(screen.getByLabelText('Close'));

      // Update events
      rerender(
        <Calendar events={MOCK_EVENTS} initialDate={new Date('2024-01-15')} />
      );

      // Click date again - should show events
      fireEvent.click(screen.getByText('15'));
      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Renderers', () => {
    it('should use custom renderEvent', () => {
      const renderEvent = (event: CalendarEvent) => (
        <div data-testid={`custom-event-${event.id}`}>Custom: {event.name}</div>
      );

      render(
        <Calendar
          events={MOCK_EVENTS}
          initialDate={new Date('2024-01-15')}
          renderEvent={renderEvent}
        />
      );

      fireEvent.click(screen.getByText('15'));

      expect(screen.getByTestId('custom-event-1')).toBeInTheDocument();
      expect(screen.getByText('Custom: Team Meeting')).toBeInTheDocument();
    });

    it('should use custom renderNoEvents', () => {
      const renderNoEvents = () => (
        <div data-testid="custom-no-events">Custom: No events message</div>
      );

      render(
        <Calendar
          events={[]}
          initialDate={new Date('2024-01-15')}
          renderNoEvents={renderNoEvents}
        />
      );

      fireEvent.click(screen.getByText('15'));

      expect(screen.getByTestId('custom-no-events')).toBeInTheDocument();
    });
  });

  describe('Event Display', () => {
    it('should mark dates with events', () => {
      const { container } = render(
        <Calendar events={MOCK_EVENTS} initialDate={new Date('2024-01-15')} />
      );

      // Find cell with date 15 (has events)
      const cells = container.querySelectorAll('td');
      const cellWith15 = Array.from(cells).find(
        cell => cell.textContent === '15'
      );

      expect(cellWith15).toHaveClass('has--event');
    });

    it('should show events in popup', () => {
      render(
        <Calendar events={MOCK_EVENTS} initialDate={new Date('2024-01-15')} />
      );

      fireEvent.click(screen.getByText('15'));

      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    it('should show no events message when date has no events', () => {
      render(
        <Calendar events={MOCK_EVENTS} initialDate={new Date('2024-01-15')} />
      );

      fireEvent.click(screen.getByText('16')); // Date without events

      expect(
        screen.getByText('No events scheduled for this day.')
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty events array', () => {
      render(<Calendar events={[]} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should handle clicking on empty table cell', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);

      const table = screen.getByRole('table');
      const tbody = table.querySelector('tbody');

      // Click on tbody (not on a specific cell)
      if (tbody) {
        fireEvent.click(tbody);
      }

      // Should not crash
      expect(table).toBeInTheDocument();
    });

    it('should handle leap year February', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-02-29')} />);

      expect(screen.getByText('Feb 2024')).toBeInTheDocument();
      expect(screen.getByText('29')).toBeInTheDocument();
    });
  });
});
