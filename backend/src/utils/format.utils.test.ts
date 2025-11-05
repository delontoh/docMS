import { formatFileSize } from './format.utils';

describe('formatFileSize', () => {
    describe('should hand correct formatted string', () => {
        it('should convert "1536 KB" to "1.50 MB"', () => {
            expect(formatFileSize('1536 KB')).toBe('1.50 MB');
        });

        it('should handle case insensitive', () => {
            expect(formatFileSize('1024 kb')).toBe('1 MB');
            expect(formatFileSize('1024 Kb')).toBe('1 MB');
            expect(formatFileSize('1024 KB')).toBe('1 MB');
        });

        it('should handle whitespace', () => {
            expect(formatFileSize('  1024 KB  ')).toBe('1 MB');
            expect(formatFileSize('1024   KB')).toBe('1 MB');
        });

        it('should handle decimal values', () => {
            expect(formatFileSize('1536.5 KB')).toBe('1.50 MB');
        });

        it('should return input as is for invalid strings', () => {
            expect(formatFileSize('invalid')).toBe('invalid');
        });

        it('should handle empty string', () => {
            expect(formatFileSize('')).toBe('');
        });
    });
});

