import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { DatePopupProps } from '../types';
import { calendarStyles } from '../../styles/react-native-styles';

export const DatePopup: React.FC<DatePopupProps> = ({
  visible,
  selectedDate,
  events,
  scheduleDay,
  onClose,
  renderEvent,
  renderNoEvents,
  showCloseButton = true,
}) => {
  if (!selectedDate) return null;

  const defaultRenderEvent = (event: any) => (
    <View key={event.id || event.name} style={calendarStyles.eventItem}>
      <Text style={calendarStyles.eventItemText}>{event.name}</Text>
    </View>
  );

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
          <View style={calendarStyles.popupWrapper}>
            {showCloseButton && (
              <TouchableOpacity
                style={calendarStyles.popupCloseButton}
                onPress={onClose}
                accessibilityLabel="Close"
              >
                <Text style={calendarStyles.popupCloseText}>✕</Text>
              </TouchableOpacity>
            )}
            <View style={calendarStyles.popupBlock}>
              <Text style={calendarStyles.popupDay}>{scheduleDay}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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
          </View>

          {showCloseButton && (
            <TouchableOpacity
              style={calendarStyles.popupCloseButton}
              onPress={onClose}
            >
              <Text style={calendarStyles.popupCloseText}>×</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
