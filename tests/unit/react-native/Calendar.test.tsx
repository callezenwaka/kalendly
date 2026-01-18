import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Calendar } from '../../../src/react-native/components/Calendar';
import { CalendarEvent } from '../../../src/core/types';
import { Text, View } from 'react-native';

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

// Skip tests - React Native requires additional vitest configuration
describe.skip('React Native Calendar Component', () => {
  describe('Rendering', () => {
    it('should render calendar with title', () => {
      render(<Calendar events={[]} title="My Calendar" />);

      expect(screen.getByText('My Calendar')).toBeTruthy();
    });

    it('should render month and year header', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);

      expect(screen.getByText('January 2024')).toBeTruthy();
    });

    it('should render day headers', () => {
      render(<Calendar events={[]} />);

      expect(screen.getByText('Sun')).toBeTruthy();
      expect(screen.getByText('Mon')).toBeTruthy();
      expect(screen.getByText('Tue')).toBeTruthy();
      expect(screen.getByText('Wed')).toBeTruthy();
      expect(screen.getByText('Thu')).toBeTruthy();
      expect(screen.getByText('Fri')).toBeTruthy();
      expect(screen.getByText('Sat')).toBeTruthy();
    });

    it('should render navigation arrows', () => {
      render(<Calendar events={[]} />);

      // Check for navigation arrow text
      expect(screen.getByText('‹')).toBeTruthy();
      expect(screen.getByText('›')).toBeTruthy();
    });

    it('should render Today button', () => {
      render(<Calendar events={[]} />);

      expect(screen.getByText('Today')).toBeTruthy();
    });
  });

  describe('Event Handling', () => {
    it('should call onDateSelect when date is pressed', () => {
      const onDateSelect = vi.fn();
      render(
        <Calendar
          events={[]}
          initialDate={new Date('2024-01-15')}
          onDateSelect={onDateSelect}
        />
      );

      const dateCell = screen.getByText('15');
      fireEvent.press(dateCell);

      expect(onDateSelect).toHaveBeenCalled();
    });

    it('should call onMonthChange when navigating months', () => {
      const onMonthChange = vi.fn();
      render(
        <Calendar
          events={[]}
          initialDate={new Date('2024-01-15')}
          onMonthChange={onMonthChange}
        />
      );

      const nextButton = screen.getByText('›');
      fireEvent.press(nextButton);

      expect(onMonthChange).toHaveBeenCalled();
    });

    it('should call onEventClick when event is pressed', () => {
      const onEventClick = vi.fn();
      render(
        <Calendar
          events={MOCK_EVENTS}
          initialDate={new Date('2024-01-15')}
          onEventClick={onEventClick}
        />
      );

      // Press date to show popup
      const dateCell = screen.getByText('15');
      fireEvent.press(dateCell);

      // Press event in popup
      const eventElement = screen.getByText('Team Meeting');
      fireEvent.press(eventElement);

      expect(onEventClick).toHaveBeenCalledWith(MOCK_EVENTS[0]);
    });

    it('should show popup on date selection', () => {
      render(
        <Calendar events={MOCK_EVENTS} initialDate={new Date('2024-01-15')} />
      );

      const dateCell = screen.getByText('15');
      fireEvent.press(dateCell);

      expect(screen.getByText('Team Meeting')).toBeTruthy();
    });

    it('should close popup on close button press', () => {
      render(
        <Calendar events={MOCK_EVENTS} initialDate={new Date('2024-01-15')} />
      );

      // Press date to show popup
      const dateCell = screen.getByText('15');
      fireEvent.press(dateCell);

      expect(screen.getByText('Team Meeting')).toBeTruthy();

      // Close popup
      const closeButton = screen.getByLabelText('Close');
      fireEvent.press(closeButton);

      expect(screen.queryByText('Team Meeting')).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should navigate to next month', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);

      expect(screen.getByText('January 2024')).toBeTruthy();

      const nextButton = screen.getByText('›');
      fireEvent.press(nextButton);

      expect(screen.getByText('February 2024')).toBeTruthy();
    });

    it('should navigate to previous month', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-03-15')} />);

      expect(screen.getByText('March 2024')).toBeTruthy();

      const prevButton = screen.getByText('‹');
      fireEvent.press(prevButton);

      expect(screen.getByText('February 2024')).toBeTruthy();
    });

    it('should navigate to today when Today button is pressed', () => {
      const today = new Date();
      const pastDate = new Date('2020-06-15');

      render(<Calendar events={[]} initialDate={pastDate} />);

      expect(screen.getByText('June 2020')).toBeTruthy();

      const todayButton = screen.getByText('Today');
      fireEvent.press(todayButton);

      const expectedMonthYear = today.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      expect(screen.getByText(expectedMonthYear)).toBeTruthy();
    });
  });

  describe('Props and Configuration', () => {
    it('should respect initialDate', () => {
      render(<Calendar events={[]} initialDate={new Date('2025-06-15')} />);

      expect(screen.getByText('June 2025')).toBeTruthy();
    });

    it('should use long month names by default', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);

      expect(screen.getByText('January 2024')).toBeTruthy();
    });

    it('should use short month names when useShortMonthNames is true', () => {
      render(
        <Calendar
          events={[]}
          initialDate={new Date('2024-01-15')}
          useShortMonthNames={true}
        />
      );

      expect(screen.getByText('Jan 2024')).toBeTruthy();
    });

    it('should update when events prop changes', () => {
      const { rerender } = render(
        <Calendar events={[]} initialDate={new Date('2024-01-15')} />
      );

      // Press date - should show no events
      fireEvent.press(screen.getByText('15'));
      expect(
        screen.getByText('No events scheduled for this day.')
      ).toBeTruthy();

      // Close popup
      fireEvent.press(screen.getByLabelText('Close'));

      // Update events
      rerender(
        <Calendar events={MOCK_EVENTS} initialDate={new Date('2024-01-15')} />
      );

      // Press date again - should show events
      fireEvent.press(screen.getByText('15'));
      expect(screen.getByText('Team Meeting')).toBeTruthy();
    });
  });

  describe('Custom Renderers', () => {
    it('should use custom renderEvent', () => {
      const renderEvent = (event: CalendarEvent) => (
        <View testID={`custom-event-${event.id}`}>
          <Text>Custom: {event.name}</Text>
        </View>
      );

      render(
        <Calendar
          events={MOCK_EVENTS}
          initialDate={new Date('2024-01-15')}
          renderEvent={renderEvent}
        />
      );

      fireEvent.press(screen.getByText('15'));

      expect(screen.getByTestId('custom-event-1')).toBeTruthy();
      expect(screen.getByText('Custom: Team Meeting')).toBeTruthy();
    });

    it('should use custom renderNoEvents', () => {
      const renderNoEvents = () => (
        <View testID="custom-no-events">
          <Text>Custom: No events message</Text>
        </View>
      );

      render(
        <Calendar
          events={[]}
          initialDate={new Date('2024-01-15')}
          renderNoEvents={renderNoEvents}
        />
      );

      fireEvent.press(screen.getByText('15'));

      expect(screen.getByTestId('custom-no-events')).toBeTruthy();
    });
  });

  describe('Event Display', () => {
    it('should show events in popup', () => {
      render(
        <Calendar events={MOCK_EVENTS} initialDate={new Date('2024-01-15')} />
      );

      fireEvent.press(screen.getByText('15'));

      expect(screen.getByText('Team Meeting')).toBeTruthy();
    });

    it('should show no events message when date has no events', () => {
      render(
        <Calendar events={MOCK_EVENTS} initialDate={new Date('2024-01-15')} />
      );

      fireEvent.press(screen.getByText('16')); // Date without events

      expect(
        screen.getByText('No events scheduled for this day.')
      ).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty events array', () => {
      const { toJSON } = render(<Calendar events={[]} />);

      expect(toJSON()).toBeTruthy();
    });

    it('should handle leap year February', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-02-29')} />);
      expect(screen.getByText('February 2024')).toBeTruthy();
      expect(screen.getByText('29')).toBeTruthy();
    });
  });

  describe('Theme Support', () => {
    it('should render with theme applied', () => {
      const theme = {
        primary: '#3b82f6',
        secondary: '#60a5fa',
        tertiary: '#93c5fd',
      };

      const { toJSON } = render(<Calendar events={[]} theme={theme} />);

      // Should render without errors
      expect(toJSON()).toBeTruthy();
    });

    it('should handle partial theme objects', () => {
      const theme = {
        primary: '#8b5cf6',
      };

      const { toJSON } = render(<Calendar events={[]} theme={theme} />);

      expect(toJSON()).toBeTruthy();
    });

    it('should work without theme (no errors)', () => {
      expect(() => {
        render(<Calendar events={[]} />);
      }).not.toThrow();
    });
  });

  describe('Month/Year Picker', () => {
    it('should open picker when header is pressed', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);

      const pickerButton = screen.getByText('January 2024');
      fireEvent.press(pickerButton);

      // Should show month options
      expect(screen.getByText('January')).toBeTruthy();
      expect(screen.getByText('February')).toBeTruthy();
      expect(screen.getByText('December')).toBeTruthy();
    });

    it('should select month from picker', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);

      // Open picker
      fireEvent.press(screen.getByText('January 2024'));

      // Select June
      fireEvent.press(screen.getByText('June'));

      expect(screen.getByText('June 2024')).toBeTruthy();
    });

    it('should navigate years in picker', () => {
      render(<Calendar events={[]} initialDate={new Date('2024-01-15')} />);

      // Open picker
      fireEvent.press(screen.getByText('January 2024'));

      // Find and press year next arrow (there should be two › symbols in picker)
      const yearArrows = screen.getAllByText('›');
      // The year arrows are inside the picker modal
      fireEvent.press(yearArrows[yearArrows.length - 1]);

      // Should show 2025 in year input
      expect(screen.getByText('January 2025')).toBeTruthy();
    });
  });

  describe('Styling Props', () => {
    it('should apply containerStyle', () => {
      const containerStyle = { backgroundColor: 'red' };
      const { toJSON } = render(
        <Calendar events={[]} containerStyle={containerStyle} />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('should apply headerStyle', () => {
      const headerStyle = { backgroundColor: 'blue' };
      const { toJSON } = render(
        <Calendar events={[]} headerStyle={headerStyle} />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('should apply cellStyle', () => {
      const cellStyle = { padding: 10 };
      const { toJSON } = render(<Calendar events={[]} cellStyle={cellStyle} />);

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Close Button', () => {
    it('should show close button by default', () => {
      render(
        <Calendar events={MOCK_EVENTS} initialDate={new Date('2024-01-15')} />
      );

      fireEvent.press(screen.getByText('15'));

      expect(screen.getByLabelText('Close')).toBeTruthy();
    });

    it('should hide close button when showCloseButton is false', () => {
      render(
        <Calendar
          events={MOCK_EVENTS}
          initialDate={new Date('2024-01-15')}
          showCloseButton={false}
        />
      );

      fireEvent.press(screen.getByText('15'));

      expect(screen.queryByLabelText('Close')).toBeNull();
    });
  });
});
