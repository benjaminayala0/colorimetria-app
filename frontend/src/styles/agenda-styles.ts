import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#6200ea',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 10,
    },
    headerDate: {
        fontSize: 14,
        color: '#e0e0e0',
        marginTop: 5,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 5,
    },

    // Summary Bar
    summaryBar: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6200ea',
    },

    // Appointment Cards
    appointmentCard: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginVertical: 8,
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    appointmentCardCompleted: {
        backgroundColor: '#e8f5e9',
        borderLeftColor: '#4caf50',
    },
    appointmentCardAbsent: {
        backgroundColor: '#ffebee',
        borderLeftColor: '#f44336',
    },
    appointmentCardCancelled: {
        backgroundColor: '#f5f5f5',
        borderLeftColor: '#9e9e9e',
    },
    appointmentCardCurrent: {
        backgroundColor: '#f3e5f5',
        borderLeftColor: '#6200ea',
        borderLeftWidth: 6,
        shadowOpacity: 0.2,
        elevation: 4,
    },
    appointmentCardUpcoming: {
        backgroundColor: '#fff',
        borderLeftColor: '#2196f3',
    },

    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    appointmentTime: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        marginRight: 8,
    },
    timeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    timeTextPast: {
        color: '#999',
    },
    timeTextCurrent: {
        color: '#6200ea',
    },
    currentBadge: {
        backgroundColor: '#6200ea',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginLeft: 8,
    },
    currentBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },

    appointmentClient: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    appointmentClientPast: {
        color: '#999',
    },

    appointmentService: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    appointmentServicePast: {
        color: '#aaa',
    },

    appointmentPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4caf50',
    },
    appointmentPricePast: {
        color: '#999',
    },

    // Action Buttons
    actionsContainer: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    actionButtonPrimary: {
        backgroundColor: '#e3f2fd',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 6,
    },
    actionButtonTextPrimary: {
        color: '#2196f3',
    },

    // Status Action Buttons
    statusActions: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 8,
    },
    statusButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 6,
        gap: 4,
    },
    completedButton: {
        backgroundColor: '#4caf50',
    },
    absentButton: {
        backgroundColor: '#f44336',
    },
    cancelledButton: {
        backgroundColor: '#9e9e9e',
    },
    statusButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 20,
    },
    emptyButton: {
        backgroundColor: '#6200ea',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // List
    listContainer: {
        paddingVertical: 10,
    },
});
