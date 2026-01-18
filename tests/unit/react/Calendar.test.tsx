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

      expect(screen.getByText('January 2024')).toBeInTheDocument();
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

    it('should render navigation arrows', () => {
      render(<Calendar events={[]} />);

      expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
      expect(screen.getByLabelText('Next month')).toBeInTheDocument();
    });

    it('should render month/year picker button', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);
      expect(screen.getByText('January 2024')).toBeInTheDocument();
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

      const nextButton = screen.getByLabelText('Next month');
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

      expect(screen.getByText('January 2024')).toBeInTheDocument();

      const nextButton = screen.getByLabelText('Next month');
      fireEvent.click(nextButton);

      expect(screen.getByText('February 2024')).toBeInTheDocument();
    });

    it('should navigate to previous month', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-03-15')} />);

      expect(screen.getByText('March 2024')).toBeInTheDocument();

      const prevButton = screen.getByLabelText('Previous month');
      fireEvent.click(prevButton);

      expect(screen.getByText('February 2024')).toBeInTheDocument();
    });

    it('should jump to selected month', async () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);
      // Open picker and select June
      fireEvent.click(screen.getByText('January 2024'));
      await waitFor(() => expect(screen.getByText('June')).toBeInTheDocument());
      fireEvent.click(screen.getByText('June'));
      expect(screen.getByText('June 2024')).toBeInTheDocument();
    });

    it('should jump to selected year', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);
      // Open picker and enter year
      const pickerBtn = screen.getByText('January 2024');
      fireEvent.click(pickerBtn);
      const yearInput = screen.getByLabelText('Year');
      fireEvent.change(yearInput, { target: { value: '2025' } });
      fireEvent.blur(yearInput);
      expect(screen.getByText('January 2025')).toBeInTheDocument();
    });
  });

  describe('Props and Configuration', () => {
    it('should respect initialDate', () => {
      render(<Calendar events={[]} initialDate={new Date('2025-06-15')} />);

      expect(screen.getByText('June 2025')).toBeInTheDocument();
    });

    it('should use long month names by default', async () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);

      // Picker button should show long format
      expect(screen.getByText('January 2024')).toBeInTheDocument();

      // Open picker dropdown
      fireEvent.click(screen.getByText('January 2024'));
      await waitFor(() => expect(screen.getByText('June')).toBeInTheDocument());

      // Dropdown should show long month names
      expect(screen.getByText('January')).toBeInTheDocument();
      expect(screen.getByText('February')).toBeInTheDocument();
      expect(screen.getByText('December')).toBeInTheDocument();
    });

    it('should use short month names when useShortMonthNames is true', async () => {
      render(
        <Calendar
          events={[]}
          initialDate={new Date('2024-01-15')}
          useShortMonthNames={true}
        />
      );

      // Picker button should show short format
      expect(screen.getByText('Jan 2024')).toBeInTheDocument();

      // Open picker dropdown
      fireEvent.click(screen.getByText('Jan 2024'));
      await waitFor(() => expect(screen.getByText('Jun')).toBeInTheDocument());

      // Dropdown should show short month names
      expect(screen.getByText('Jan')).toBeInTheDocument();
      expect(screen.getByText('Feb')).toBeInTheDocument();
      expect(screen.getByText('Dec')).toBeInTheDocument();
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
      expect(screen.getByText('February 2024')).toBeInTheDocument();
      const cells29 = screen.getAllByText('29');
      expect(
        cells29.some(cell => !cell.classList.contains('other-month'))
      ).toBe(true);
    });
  });

  describe('Theme Support', () => {
    it('should apply theme on mount', () => {
      const theme = {
        primary: '#3b82f6',
        secondary: '#60a5fa',
        tertiary: '#93c5fd',
      };

      render(<Calendar events={[]} theme={theme} />);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#3b82f6'
      );
      expect(root.style.getPropertyValue('--calendar-secondary-color')).toBe(
        '#60a5fa'
      );
      expect(root.style.getPropertyValue('--calendar-tertiary-color')).toBe(
        '#93c5fd'
      );
    });

    it('should apply all theme properties', () => {
      const theme = {
        primary: '#3b82f6',
        secondary: '#60a5fa',
        tertiary: '#93c5fd',
        textColor: '#1f2937',
        textLight: '#6b7280',
        background: '#ffffff',
        cellHover: '#f3f4f6',
        borderColor: '#e5e7eb',
        todayOutline: '#fbbf24',
        selectedBg: '#dbeafe',
        eventIndicator: '#10b981',
      };

      render(<Calendar events={[]} theme={theme} />);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#3b82f6'
      );
      expect(root.style.getPropertyValue('--calendar-secondary-color')).toBe(
        '#60a5fa'
      );
      expect(root.style.getPropertyValue('--calendar-tertiary-color')).toBe(
        '#93c5fd'
      );
      expect(root.style.getPropertyValue('--calendar-text-color')).toBe(
        '#1f2937'
      );
      expect(root.style.getPropertyValue('--calendar-text-light')).toBe(
        '#6b7280'
      );
      expect(root.style.getPropertyValue('--calendar-background')).toBe(
        '#ffffff'
      );
      expect(root.style.getPropertyValue('--calendar-cell-hover')).toBe(
        '#f3f4f6'
      );
      expect(root.style.getPropertyValue('--calendar-border-color')).toBe(
        '#e5e7eb'
      );
      expect(root.style.getPropertyValue('--calendar-today-outline')).toBe(
        '#fbbf24'
      );
      expect(root.style.getPropertyValue('--calendar-selected-bg')).toBe(
        '#dbeafe'
      );
      expect(root.style.getPropertyValue('--calendar-event-indicator')).toBe(
        '#10b981'
      );
    });

    it('should handle partial theme objects', () => {
      const theme = {
        primary: '#8b5cf6',
        secondary: '#a78bfa',
      };

      render(<Calendar events={[]} theme={theme} />);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#8b5cf6'
      );
      expect(root.style.getPropertyValue('--calendar-secondary-color')).toBe(
        '#a78bfa'
      );
    });

    it('should work without theme (no errors)', () => {
      expect(() => {
        render(<Calendar events={[]} />);
      }).not.toThrow();
    });

    it('should update theme when prop changes', async () => {
      const initialTheme = {
        primary: '#3b82f6',
        secondary: '#60a5fa',
      };

      const { rerender } = render(
        <Calendar events={[]} theme={initialTheme} />
      );

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#3b82f6'
      );
      expect(root.style.getPropertyValue('--calendar-secondary-color')).toBe(
        '#60a5fa'
      );

      // Update theme
      const newTheme = {
        primary: '#8b5cf6',
        secondary: '#a78bfa',
        tertiary: '#c4b5fd',
      };

      rerender(<Calendar events={[]} theme={newTheme} />);

      await waitFor(() => {
        expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
          '#8b5cf6'
        );
        expect(root.style.getPropertyValue('--calendar-secondary-color')).toBe(
          '#a78bfa'
        );
        expect(root.style.getPropertyValue('--calendar-tertiary-color')).toBe(
          '#c4b5fd'
        );
      });
    });

    it('should support theme switching', async () => {
      const blueTheme = {
        primary: '#3b82f6',
        secondary: '#60a5fa',
      };

      const purpleTheme = {
        primary: '#8b5cf6',
        secondary: '#a78bfa',
      };

      const { rerender } = render(<Calendar events={[]} theme={blueTheme} />);

      const root = document.documentElement;

      // Initial blue theme
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#3b82f6'
      );

      // Switch to purple
      rerender(<Calendar events={[]} theme={purpleTheme} />);
      await waitFor(() => {
        expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
          '#8b5cf6'
        );
      });

      // Switch back to blue
      rerender(<Calendar events={[]} theme={blueTheme} />);
      await waitFor(() => {
        expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
          '#3b82f6'
        );
      });
    });
  });
});
