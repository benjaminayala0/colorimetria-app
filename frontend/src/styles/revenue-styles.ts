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
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 5,
    },

    // Period Tabs
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginHorizontal: 5,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#6200ea',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
    },

    // Summary Section
    summaryContainer: {
        backgroundColor: '#fff',
        margin: 15,
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 5,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#6200ea',
    },
    summaryValueSecondary: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },

    // Date Range
    dateRangeContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 10,
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateRangeText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },

    // Appointments List
    listContainer: {
        flex: 1,
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 15,
        overflow: 'hidden',
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        padding: 15,
        paddingBottom: 10,
    },
    appointmentCard: {
        backgroundColor: '#f8f9fa',
        marginHorizontal: 15,
        marginBottom: 10,
        padding: 15,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#6200ea',
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    appointmentDate: {
        fontSize: 12,
        color: '#666',
    },
    appointmentPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4caf50',
    },
    appointmentClient: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    appointmentService: {
        fontSize: 14,
        color: '#666',
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
        marginTop: 10,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
