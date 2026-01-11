import { StyleSheet } from 'react-native';

export const defaultColors = {
  primary: '#fc8917',
  secondary: '#fca045',
  tertiary: '#fdb873',
  text: '#2c3e50',
  border: '#dee2e6',
  todayOutline: '#f7db04',
  eventIndicator: '#1890ff',
  background: '#fff',
  white: '#ffffff',
  scrollHint: '#fff3e0',
  scrollHintText: '#f59e0b',
};

export type CalendarColors = typeof defaultColors;

export const getResponsiveStyles = (
  width: number,
  height: number,
  customColors?: Partial<CalendarColors>
) => {
  const colors = { ...defaultColors, ...customColors };
  // Device type detection
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;
  const isPhone = width < 768;

  // Responsive dimensions
  const cellSize = (width - 60) / 7;

  // Popup dimensions based on device type
  const popupWidth = isTablet ? 500 : isPhone ? width * 0.95 : width * 0.9;
  const popupMaxWidth = isTablet ? 500 : isPhone ? width : 400;
  const popupMaxHeight = isTablet ? height * 0.8 : height * 0.85;

  // Font sizes
  const headerFontSize = isTablet ? 18 : isSmallPhone ? 15 : 16;
  const eventTitleSize = isTablet ? 16 : isSmallPhone ? 14 : 15;
  const eventDetailSize = isTablet ? 13 : isSmallPhone ? 11 : 12;
  const badgeFontSize = isTablet ? 10 : isSmallPhone ? 9 : 9;

  // Padding
  const eventCardPadding = isTablet ? 14 : isSmallPhone ? 10 : 12;
  const containerPadding = isTablet ? 15 : isSmallPhone ? 10 : 12;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    titleContainer: {
      paddingVertical: 20,
      alignItems: 'center',
    },

    title: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
    },

    contentContainer: {
      marginHorizontal: 20,
      marginTop: 20,
    },

    card: {
      backgroundColor: colors.background,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      overflow: 'hidden',
    },

    cardHeader: {
      backgroundColor: colors.tertiary,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    cardHeaderText: {
      fontSize: 18,
      fontWeight: '500',
      color: colors.text,
      textAlign: 'center',
    },

    table: {
      backgroundColor: colors.background,
    },

    tableHeader: {
      flexDirection: 'row',
      backgroundColor: 'rgba(252, 137, 23, 0.1)',
      borderBottomWidth: 2,
      borderBottomColor: colors.border,
    },

    tableHeaderCell: {
      flex: 1,
      paddingVertical: 12,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    tableHeaderText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },

    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    tableCell: {
      flex: 1,
      height: cellSize,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },

    tableCellText: {
      fontSize: 16,
      color: colors.text,
    },

    cellToday: {
      borderWidth: 2,
      borderColor: colors.todayOutline,
    },

    cellTodayText: {
      fontWeight: 'bold',
    },

    cellWithEvents: {
      backgroundColor: 'rgba(252, 160, 69, 0.3)',
    },

    eventIndicator: {
      position: 'absolute',
      bottom: 2,
      width: 4,
      height: 4,
      backgroundColor: colors.eventIndicator,
      borderRadius: 2,
    },

    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 20,
      gap: 15,
    },

    navigationButton: {
      flex: 1,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 6,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    navigationButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },

    navigationButtonPressed: {
      backgroundColor: colors.primary,
    },

    navigationButtonTextPressed: {
      color: colors.white,
    },

    jumpForm: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 10,
    },

    jumpLabel: {
      fontSize: 18,
      fontWeight: '300',
      color: colors.text,
    },

    jumpSelect: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.background,
      minWidth: 80,
    },

    jumpSelectText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },

    // RESPONSIVE POPUP STYLES
    popupOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },

    popup: {
      backgroundColor: colors.white,
      borderRadius: 8,
      width: popupWidth,
      maxWidth: popupMaxWidth,
      maxHeight: popupMaxHeight,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
      overflow: 'hidden',
    },

    popupHeader: {
      backgroundColor: colors.primary,
      paddingVertical: isTablet ? 15 : 12,
      paddingHorizontal: isTablet ? 20 : 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    popupHeaderText: {
      fontSize: headerFontSize,
      fontWeight: '600',
      color: colors.white,
      flex: 1,
    },

    popupCloseButton: {
      width: isTablet ? 32 : isSmallPhone ? 26 : 28,
      height: isTablet ? 32 : isSmallPhone ? 26 : 28,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    popupCloseText: {
      color: colors.white,
      fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18,
      fontWeight: 'bold',
    },

    scrollHint: {
      backgroundColor: colors.scrollHint,
      paddingVertical: isTablet ? 10 : 8,
      paddingHorizontal: containerPadding,
      alignItems: 'center',
    },

    scrollHintText: {
      color: colors.scrollHintText,
      fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12,
      fontWeight: '500',
    },

    eventsContainer: {
      maxHeight: popupMaxHeight - 150,
    },

    eventsList: {
      padding: containerPadding,
      gap: isTablet ? 12 : 10,
    },

    eventCard: {
      backgroundColor: colors.white,
      borderRadius: 6,
      padding: eventCardPadding,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },

    eventHeader: {
      marginBottom: 10,
    },

    eventTitle: {
      fontSize: eventTitleSize,
      color: '#1f2937',
      fontWeight: '600',
      marginBottom: 8,
    },

    eventBadges: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
    },

    badge: {
      paddingHorizontal: isTablet ? 8 : 6,
      paddingVertical: isTablet ? 3 : 2,
      borderRadius: 10,
    },

    badgeText: {
      fontSize: badgeFontSize,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },

    priorityBadgeHigh: {
      backgroundColor: '#fee2e2',
    },

    priorityBadgeMedium: {
      backgroundColor: '#fef3c7',
    },

    priorityBadgeLow: {
      backgroundColor: '#dcfce7',
    },

    statusBadgeCompleted: {
      backgroundColor: '#d1fae5',
    },

    statusBadgeCancelled: {
      backgroundColor: '#fee2e2',
    },

    statusBadgeTentative: {
      backgroundColor: '#e0e7ff',
    },

    categoryBadgeWork: {
      backgroundColor: '#dbeafe',
    },

    categoryBadgePersonal: {
      backgroundColor: '#fef3c7',
    },

    categoryBadgeMeeting: {
      backgroundColor: '#d1fae5',
    },

    categoryBadgeDeadline: {
      backgroundColor: '#fee2e2',
    },

    categoryBadgeAppointment: {
      backgroundColor: '#fef3c7',
    },

    categoryBadgeOther: {
      backgroundColor: '#f3f4f6',
    },

    eventTime: {
      flexDirection: isSmallPhone ? 'column' : 'row',
      gap: isSmallPhone ? 2 : 8,
      marginBottom: 6,
    },

    eventTimeLabel: {
      fontSize: eventDetailSize,
      fontWeight: '600',
      color: '#6b7280',
      minWidth: isSmallPhone ? undefined : isTablet ? 80 : 70,
      textAlign: 'left',
    },

    eventTimeValue: {
      fontSize: eventDetailSize,
      color: '#374151',
      flex: 1,
    },

    eventDescription: {
      color: '#4b5563',
      fontSize: eventDetailSize,
      lineHeight: isTablet ? 20 : 18,
      marginTop: 10,
      marginBottom: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#f9fafb',
      borderLeftWidth: 2,
      borderLeftColor: '#e5e7eb',
      borderRadius: 4,
      textAlign: 'left',
    },

    eventUrlContainer: {
      marginTop: 8,
    },

    eventLink: {
      color: '#2563eb',
      fontSize: eventDetailSize,
      fontWeight: '500',
    },

    eventTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },

    eventTag: {
      paddingHorizontal: isTablet ? 10 : 8,
      paddingVertical: isTablet ? 3 : 2,
      backgroundColor: '#e0f2fe',
      borderRadius: 12,
    },

    eventTagText: {
      fontSize: isTablet ? 11 : 10,
      color: '#0369a1',
      fontWeight: '500',
    },

    noEventsMessage: {
      padding: containerPadding,
      paddingVertical: isTablet ? 30 : 20,
      alignItems: 'center',
    },

    noEventsText: {
      fontSize: isTablet ? 14 : 13,
      color: '#6b7280',
      textAlign: 'center',
    },
  });
};

// Export default styles for backwards compatibility
export const calendarStyles = getResponsiveStyles(375, 667);
export default calendarStyles;
