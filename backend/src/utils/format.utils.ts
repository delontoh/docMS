/**
 * Format file size string to readable format
 * @param fileSize - File size string
 * @returns Formatted file size string (e.g., "1 MB", "5 MB", "100 KB")
 */
export const formatFileSize = (fileSize: string): string => {
    const fileSizeStr = fileSize.trim();
    
    const formattedMatch = fileSizeStr.match(/^([\d.]+)\s*KB$/i);
    if (!formattedMatch) {
        return fileSizeStr;
    }
    
    const [, sizeStr] = formattedMatch;
    const size = parseFloat(sizeStr);
    
    if (isNaN(size) || size < 0) {
        return fileSizeStr;
    }
    
    //Convert to bytes and format
    const bytes = size * 1024;
    return formatBytes(bytes);
};

/**
 * Format bytes to readable format
 */
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 KB';
    
    const kb = bytes / 1024;
    if (kb >= 1024) {
        const mb = kb / 1024;
        const rounded = Math.round(mb * 100) / 100;
        const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
        return `${formatted} MB`;
    }
    
    const rounded = Math.round(kb * 100) / 100;
    const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
    return `${formatted} KB`;
};