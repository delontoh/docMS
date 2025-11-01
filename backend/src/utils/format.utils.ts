/**
 * Format file size from bytes to readable format (Bytes, KB, MB)
 * @param fileSize - File size string
 * @returns Formatted file size string
 */
export const formatFileSize = (fileSize: string): string => {
    if (fileSize.includes('KB') || fileSize.includes('MB') || fileSize.includes('Bytes') || fileSize.includes('GB')) {
        return fileSize;
    }

    const bytes = Number.parseInt(fileSize, 10);
    if (isNaN(bytes) || bytes < 0) {
        return fileSize;
    }

    if (bytes === 0) return '0 Bytes';

    const k = 1024; //1024 Bytes in 1 Kilobyte
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizeIndex = Math.min(i, sizes.length - 1);
    
    const convertedSize = bytes / Math.pow(k, sizeIndex);
    
    //Round to 2 decimal places, but show integer if it's a whole number
    const roundedSize = Math.round(convertedSize * 100) / 100;
    const formattedSize = roundedSize % 1 === 0 ? roundedSize.toString() : roundedSize.toFixed(2);
    
    return `${formattedSize} ${sizes[sizeIndex]}`;
};

