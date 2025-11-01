/**
 * Format date string to dd/mmm/yyyy format
 * @param dateString - Date string or Date object
 * @returns Formatted date string (e.g., "01 Jan 2024")
 */
export const formatDate = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
};

