import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Calendar from '../../../src/vue/components/Calendar.vue';
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

describe('Vue Calendar Component', () => {
  describe('Rendering', () => {
    it('should render calendar structure', () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
        },
      });

      expect(wrapper.find('.kalendly-calendar').exists()).toBe(true);
      expect(wrapper.find('.calendar--table').exists()).toBe(true);
    });

    it('should render with title', () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          title: 'My Calendar',
        },
      });

      expect(wrapper.find('h1').text()).toBe('My Calendar');
    });

    it('should render with custom title slot', () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
        },
        slots: {
          title: '<div class="custom-title">Custom Title</div>',
        },
      });

      expect(wrapper.find('.custom-title').exists()).toBe(true);
      expect(wrapper.find('.custom-title').text()).toBe('Custom Title');
    });

    it('should render navigation controls', () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
        },
      });

      expect(wrapper.find('.calendar--navigation--buttons').exists()).toBe(
        true
      );
      expect(wrapper.findAll('button').length).toBeGreaterThan(0);
    });

    it('should render with events', () => {
      const wrapper = mount(Calendar, {
        props: {
          events: MOCK_EVENTS,
          initialDate: new Date('2024-01-15'),
        },
      });

      expect(wrapper.find('.calendar--table').exists()).toBe(true);
    });

    it('should render month and year text', () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          initialDate: new Date('2024-01-15'),
        },
      });

      expect(wrapper.find('.calendar--card--header').text()).toContain('Jan');
      expect(wrapper.find('.calendar--card--header').text()).toContain('2024');
    });

    it('should apply custom class', () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          class: 'custom-calendar-class',
        },
      });

      expect(wrapper.find('.kalendly-calendar').classes()).toContain(
        'custom-calendar-class'
      );
    });
  });

  describe('Event Handling', () => {
    it('should emit date-select event when date is clicked', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          initialDate: new Date('2024-01-15'),
        },
      });

      const dateCell = wrapper.findAll('td').find(td => td.text() === '15');
      await dateCell?.trigger('click');

      expect(wrapper.emitted('date-select')).toBeTruthy();
    });

    it('should emit month-change event when navigating', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          initialDate: new Date('2024-01-15'),
        },
      });

      const nextButton = wrapper
        .findAll('button')
        .find(btn => btn.text() === 'Next');
      await nextButton?.trigger('click');

      expect(wrapper.emitted('month-change')).toBeTruthy();
    });

    it('should emit event-click when event is clicked', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: MOCK_EVENTS,
          initialDate: new Date('2024-01-15'),
        },
      });

      // Click date to show popup
      const dateCell = wrapper.findAll('td').find(td => td.text() === '15');
      await dateCell?.trigger('click');

      await wrapper.vm.$nextTick();

      // Click event
      const eventItem = wrapper.find('.event--item');
      await eventItem.trigger('click');

      expect(wrapper.emitted('event-click')).toBeTruthy();
    });

    it('should show popup when date is selected', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: MOCK_EVENTS,
          initialDate: new Date('2024-01-15'),
        },
      });

      const dateCell = wrapper.findAll('td').find(td => td.text() === '15');
      await dateCell?.trigger('click');

      await wrapper.vm.$nextTick();

      expect(wrapper.find('.date-popup').exists()).toBe(true);
    });

    it('should close popup when close button is clicked', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: MOCK_EVENTS,
          initialDate: new Date('2024-01-15'),
        },
      });

      // Open popup
      const dateCell = wrapper.findAll('td').find(td => td.text() === '15');
      await dateCell?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.date-popup').exists()).toBe(true);

      // Close popup
      const closeButton = wrapper.find('.popup-close');
      await closeButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.date-popup').exists()).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should navigate to next month', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          initialDate: new Date('2024-01-15'),
        },
      });

      expect(wrapper.find('.calendar--card--header').text()).toContain(
        'Jan 2024'
      );

      const nextButton = wrapper
        .findAll('button')
        .find(btn => btn.text() === 'Next');
      await nextButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.calendar--card--header').text()).toContain(
        'Feb 2024'
      );
    });

    it('should navigate to previous month', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          initialDate: new Date('2024-03-15'),
        },
      });

      expect(wrapper.find('.calendar--card--header').text()).toContain(
        'Mar 2024'
      );

      const prevButton = wrapper
        .findAll('button')
        .find(btn => btn.text() === 'Previous');
      await prevButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.calendar--card--header').text()).toContain(
        'Feb 2024'
      );
    });

    it('should jump to selected month', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          initialDate: new Date('2024-01-15'),
        },
      });

      const selects = wrapper.findAll('select');
      const monthSelect = selects[0];

      await monthSelect.setValue(5); // June
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.calendar--card--header').text()).toContain(
        'Jun 2024'
      );
    });

    it('should jump to selected year', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          initialDate: new Date('2024-01-15'),
        },
      });

      const selects = wrapper.findAll('select');
      const yearSelect = selects[1];

      await yearSelect.setValue(2025);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.calendar--card--header').text()).toContain(
        'Jan 2025'
      );
    });
  });

  describe('Props and Configuration', () => {
    it('should accept all props', () => {
      const wrapper = mount(Calendar, {
        props: {
          events: MOCK_EVENTS,
          initialDate: new Date('2024-06-15'),
          minYear: 2020,
          maxYear: 2030,
          weekStartsOn: 1,
          title: 'Test Calendar',
        },
      });

      expect(wrapper.find('.calendar--table').exists()).toBe(true);
      expect(wrapper.find('h1').text()).toBe('Test Calendar');
    });

    it('should respect initialDate', () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          initialDate: new Date('2025-06-15'),
        },
      });

      expect(wrapper.find('.calendar--card--header').text()).toContain(
        'Jun 2025'
      );
    });

    it('should update when events prop changes', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          initialDate: new Date('2024-01-15'),
        },
      });

      // Click date - should show no events
      const dateCell = wrapper.findAll('td').find(td => td.text() === '15');
      await dateCell?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.no-events-message').exists()).toBe(true);

      // Close popup
      await wrapper.find('.popup-close').trigger('click');
      await wrapper.vm.$nextTick();

      // Update events
      await wrapper.setProps({ events: MOCK_EVENTS });
      await wrapper.vm.$nextTick();

      // Click date again
      const dateCell2 = wrapper.findAll('td').find(td => td.text() === '15');
      await dateCell2?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.event--wrapper').exists()).toBe(true);
    });
  });

  describe('Slots', () => {
    it('should use event slot', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: MOCK_EVENTS,
          initialDate: new Date('2024-01-15'),
        },
        slots: {
          event:
            '<template #event="{ event }"><div class="custom-event">{{ event.name }}</div></template>',
        },
      });

      // Click date to show events
      const dateCell = wrapper.findAll('td').find(td => td.text() === '15');
      await dateCell?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.custom-event').exists()).toBe(true);
    });

    it('should use no-events slot', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          initialDate: new Date('2024-01-15'),
        },
        slots: {
          'no-events': '<div class="custom-no-events">No events today!</div>',
        },
      });

      // Click date
      const dateCell = wrapper.findAll('td').find(td => td.text() === '15');
      await dateCell?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.custom-no-events').exists()).toBe(true);
    });
  });

  describe('Event Display', () => {
    it('should display events in popup', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: MOCK_EVENTS,
          initialDate: new Date('2024-01-15'),
        },
      });

      const dateCell = wrapper.findAll('td').find(td => td.text() === '15');
      await dateCell?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Team Meeting');
    });

    it('should display no events message when no events', async () => {
      const wrapper = mount(Calendar, {
        props: {
          events: MOCK_EVENTS,
          initialDate: new Date('2024-01-15'),
        },
      });

      const dateCell = wrapper.findAll('td').find(td => td.text() === '16');
      await dateCell?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.no-events-message').exists()).toBe(true);
      expect(wrapper.text()).toContain('No events scheduled for this day');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty events array', () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
        },
      });

      expect(wrapper.find('.calendar--table').exists()).toBe(true);
    });

    it('should handle leap year February', () => {
      const wrapper = mount(Calendar, {
        props: {
          events: [],
          initialDate: new Date('2024-02-29'),
        },
      });

      expect(wrapper.find('.calendar--card--header').text()).toContain(
        'Feb 2024'
      );
      // Should render day 29
      expect(wrapper.findAll('td').some(td => td.text() === '29')).toBe(true);
    });
  });
});
