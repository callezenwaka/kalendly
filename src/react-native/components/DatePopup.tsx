import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  useWindowDimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { DatePopupProps } from '../types';
import { getResponsiveStyles } from '../../styles/react-native-styles';
import { formatTimeRange, formatAttendees } from '../../core/utils';

type BadgeStyles = {
  badge: ViewStyle;
  badgeText: TextStyle;
  priorityBadgeHigh: ViewStyle;
  priorityBadgeMedium: ViewStyle;
  priorityBadgeLow: ViewStyle;
  statusBadgeCompleted: ViewStyle;
  statusBadgeCancelled: ViewStyle;
  statusBadgeTentative: ViewStyle;
  categoryBadgeWork: ViewStyle;
  categoryBadgePersonal: ViewStyle;
  categoryBadgeMeeting: ViewStyle;
  categoryBadgeDeadline: ViewStyle;
  categoryBadgeAppointment: ViewStyle;
  categoryBadgeOther: ViewStyle;
};

const PriorityBadge: React.FC<{ priority?: string; styles: BadgeStyles }> = ({
  priority,
  styles,
}) => {
  if (!priority) return null;

  const priorityConfig: Record<string, { label: string; style: ViewStyle }> = {
    high: { label: 'HIGH', style: styles.priorityBadgeHigh },
    medium: { label: 'MEDIUM', style: styles.priorityBadgeMedium },
    low: { label: 'LOW', style: styles.priorityBadgeLow },
  };

  const config = priorityConfig[priority];
  if (!config) return null;

  return (
    <View style={[styles.badge, config.style]}>
      <Text style={styles.badgeText}>{config.label}</Text>
    </View>
  );
};

const StatusBadge: React.FC<{ status?: string; styles: BadgeStyles }> = ({
  status,
  styles,
}) => {
  if (!status || status === 'scheduled') return null;

  const statusConfig: Record<string, { label: string; style: ViewStyle }> = {
    completed: { label: 'COMPLETED', style: styles.statusBadgeCompleted },
    cancelled: { label: 'CANCELLED', style: styles.statusBadgeCancelled },
    tentative: { label: 'TENTATIVE', style: styles.statusBadgeTentative },
  };

  const config = statusConfig[status];
  if (!config) return null;

  return (
    <View style={[styles.badge, config.style]}>
      <Text style={styles.badgeText}>{config.label}</Text>
    </View>
  );
};

const CategoryBadge: React.FC<{ category?: string; styles: BadgeStyles }> = ({
  category,
  styles,
}) => {
  if (!category) return null;

  const categoryConfig: Record<string, { label: string; style: ViewStyle }> = {
    work: { label: 'WORK', style: styles.categoryBadgeWork },
    personal: { label: 'PERSONAL', style: styles.categoryBadgePersonal },
    meeting: { label: 'MEETING', style: styles.categoryBadgeMeeting },
    deadline: { label: 'DEADLINE', style: styles.categoryBadgeDeadline },
    appointment: {
      label: 'APPOINTMENT',
      style: styles.categoryBadgeAppointment,
    },
    other: { label: 'OTHER', style: styles.categoryBadgeOther },
  };

  const config = categoryConfig[category];
  if (!config) return null;

  return (
    <View style={[styles.badge, config.style]}>
      <Text style={styles.badgeText}>{config.label}</Text>
    </View>
  );
};

export const DatePopup: React.FC<DatePopupProps> = ({
  visible,
  selectedDate,
  events,
  scheduleDay,
  onClose,
  onEventClick,
  renderEvent,
  renderNoEvents,
  showCloseButton = true,
}) => {
  const { width, height } = useWindowDimensions();
  const calendarStyles = getResponsiveStyles(width, height);

  if (!selectedDate) return null;

  const showScrollHint = events.length > 3;

  const handleEventClick = (event: DatePopupProps['events'][number]) => {
    onEventClick?.(event);
  };

  const defaultRenderEvent = (event: DatePopupProps['events'][number]) => {
    const timeRange = formatTimeRange(event);
    const attendeesList = formatAttendees(event.attendees);

    const handleUrlPress = () => {
      if (event.url) {
        Linking.openURL(event.url).catch(err =>
          console.error('Failed to open URL:', err)
        );
      }
    };

    const eventContent = (
      <>
        <View style={calendarStyles.eventHeader}>
          <Text style={calendarStyles.eventTitle}>{event.name}</Text>
          <View style={calendarStyles.eventBadges}>
            <CategoryBadge category={event.category} styles={calendarStyles} />
            <PriorityBadge priority={event.priority} styles={calendarStyles} />
            <StatusBadge status={event.status} styles={calendarStyles} />
          </View>
        </View>

        {timeRange && (
          <View style={calendarStyles.eventTime}>
            <Text style={calendarStyles.eventTimeLabel}>Time:</Text>
            <Text style={calendarStyles.eventTimeValue}>{timeRange}</Text>
          </View>
        )}

        {event.description && (
          <Text style={calendarStyles.eventDescription}>
            {event.description}
          </Text>
        )}

        {event.location && (
          <View style={calendarStyles.eventTime}>
            <Text style={calendarStyles.eventTimeLabel}>Location:</Text>
            <Text style={calendarStyles.eventTimeValue}>{event.location}</Text>
          </View>
        )}

        {attendeesList && (
          <View style={calendarStyles.eventTime}>
            <Text style={calendarStyles.eventTimeLabel}>Attendees:</Text>
            <Text style={calendarStyles.eventTimeValue}>{attendeesList}</Text>
          </View>
        )}

        {event.organizer && (
          <View style={calendarStyles.eventTime}>
            <Text style={calendarStyles.eventTimeLabel}>Organizer:</Text>
            <Text style={calendarStyles.eventTimeValue}>{event.organizer}</Text>
          </View>
        )}

        {event.notes && (
          <View style={calendarStyles.eventTime}>
            <Text style={calendarStyles.eventTimeLabel}>Notes:</Text>
            <Text style={calendarStyles.eventTimeValue}>{event.notes}</Text>
          </View>
        )}

        {event.url && (
          <TouchableOpacity
            onPress={handleUrlPress}
            style={calendarStyles.eventUrlContainer}
          >
            <Text style={calendarStyles.eventLink}>View Details →</Text>
          </TouchableOpacity>
        )}

        {event.tags && event.tags.length > 0 && (
          <View style={calendarStyles.eventTags}>
            {event.tags.map((tag: string, idx: number) => (
              <View key={idx} style={calendarStyles.eventTag}>
                <Text style={calendarStyles.eventTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </>
    );

    if (onEventClick) {
      return (
        <TouchableOpacity
          key={event.id || event.name}
          style={[
            calendarStyles.eventCard,
            event.color && { borderLeftColor: event.color },
          ]}
          onPress={() => handleEventClick(event)}
          activeOpacity={0.7}
        >
          {eventContent}
        </TouchableOpacity>
      );
    }

    return (
      <View
        key={event.id || event.name}
        style={[
          calendarStyles.eventCard,
          event.color && { borderLeftColor: event.color },
        ]}
      >
        {eventContent}
      </View>
    );
  };

  const defaultRenderNoEvents = () => (
    <View style={calendarStyles.noEventsMessage}>
      <Text style={calendarStyles.noEventsText}>
        No events scheduled for this day.
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={calendarStyles.popupOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={calendarStyles.popup}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          <View style={calendarStyles.popupHeader}>
            <Text style={calendarStyles.popupHeaderText}>{scheduleDay}</Text>
            {showCloseButton && (
              <TouchableOpacity
                style={calendarStyles.popupCloseButton}
                onPress={onClose}
                accessibilityLabel="Close"
              >
                <Text style={calendarStyles.popupCloseText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {showScrollHint && (
            <View style={calendarStyles.scrollHint}>
              <Text style={calendarStyles.scrollHintText}>
                ↓ Scroll to see more events ↓
              </Text>
            </View>
          )}

          <ScrollView
            style={calendarStyles.eventsContainer}
            showsVerticalScrollIndicator={true}
          >
            {events.length > 0 ? (
              <View style={calendarStyles.eventsList}>
                {events.map(event =>
                  renderEvent ? renderEvent(event) : defaultRenderEvent(event)
                )}
              </View>
            ) : renderNoEvents ? (
              renderNoEvents()
            ) : (
              defaultRenderNoEvents()
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
