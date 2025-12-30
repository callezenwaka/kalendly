import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const cellSize = (width - 60) / 7; // Account for padding

export const colors = {
  primary: '#fc8917',
  secondary: '#fca045',
  tertiary: '#fdb873',
  text: '#2c3e50',
  border: '#dee2e6',
  todayOutline: '#f7db04',
  eventIndicator: '#1890ff',
  background: '#fff',
  white: '#ffffff',
};

export const calendarStyles = StyleSheet.create({
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

  // Calendar Table Styles
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

  // Calendar Cell States
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

  // Navigation Buttons
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

  // Jump Form
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

  // Popup Styles
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
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 0,
    width: width * 0.8,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },

  popupWrapper: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 12,
  },

  popupBlock: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  popupDay: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },

  eventsList: {
    gap: 6,
  },

  eventItem: {
    backgroundColor: colors.tertiary,
    borderRadius: 6,
    padding: 12,
  },

  eventItemText: {
    fontSize: 14,
    color: colors.text,
  },

  noEventsMessage: {
    backgroundColor: colors.tertiary,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },

  noEventsText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },

  popupCloseButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  popupCloseText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default calendarStyles;
