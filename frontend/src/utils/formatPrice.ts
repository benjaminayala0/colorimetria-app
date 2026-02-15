/**
 * Format a number as Argentine peso (thousands separator with dot, no decimals)
 * @param price - The price to format
 * @returns Formatted price string (e.g., "15.000")
 */
export const formatPrice = (price: number | undefined): string => {
    if (price === undefined || price === null) {
        return '--';
    }

    // Round to nearest integer (no decimals)
    const rounded = Math.round(price);

    // Format with dot as thousands separator
    return rounded.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};
