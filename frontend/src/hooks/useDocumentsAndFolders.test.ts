import { renderHook, waitFor } from '@testing-library/react';
import { useDocumentsAndFolders } from './useDocumentsAndFolders';
import { getUserDocumentsAndFolders, searchUserDocumentsAndFolders } from '@/lib/api';

//Mock APIs
jest.mock('@/lib/api', () => ({
    getUserDocumentsAndFolders: jest.fn(),
    searchUserDocumentsAndFolders: jest.fn(),
}));

const mockGetUserDocumentsAndFolders = getUserDocumentsAndFolders as any;
const mockSearchUserDocumentsAndFolders = searchUserDocumentsAndFolders as any;

describe('useDocumentsAndFolders', () => {
    const mockDocuments = [
        {
            id: 1,
            name: 'Document 1.pdf',
            file_size: '100 KB',
            file_type: 'document',
            document_user_id: 1,
            folder_document_id: null,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            created_by: { id: 1, name: 'Test User', email: 'test@example.com' },
        },
        {
            id: 2,
            name: 'Document 2.docx',
            file_size: '200 KB',
            file_type: 'document',
            document_user_id: 1,
            folder_document_id: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            created_by: { id: 1, name: 'Test User', email: 'test@example.com' },
        },
    ];

    const mockFolders = [
        {
            id: 1,
            name: 'Folder 1',
            file_type: 'folder',
            folders_user_id: 1,
            created_at: '2024-01-03T00:00:00Z',
            updated_at: '2024-01-03T00:00:00Z',
            created_by: { id: 1, name: 'Test User', email: 'test@example.com' },
            documents: [],
        },
        {
            id: 2,
            name: 'Folder 2',
            file_type: 'folder',
            folders_user_id: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            created_by: { id: 1, name: 'Test User', email: 'test@example.com' },
            documents: [],
        },
    ];

    const mockResponse = {
        success: true,
        documents: mockDocuments,
        folders: mockFolders,
        documentsTotal: 2,
        foldersTotal: 2,
        total: 4,
        page: 1,
        limit: 10,
        totalPages: 1,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return initial loading state', () => {
        mockGetUserDocumentsAndFolders.mockResolvedValue(mockResponse);

        const { result } = renderHook(() =>
            useDocumentsAndFolders({
                userId: 1,
                page: 1,
                rowsPerPage: 10,
                searchQuery: '',
            })
        );

        expect(result.current.loading).toBe(true);
        expect(result.current.items).toEqual([]);
        expect(result.current.error).toBe(null);
    });

    it('should fetch documents and folders without search query', async () => {
        mockGetUserDocumentsAndFolders.mockResolvedValue(mockResponse);

        const { result } = renderHook(() =>
            useDocumentsAndFolders({
                userId: 1,
                page: 1,
                rowsPerPage: 10,
                searchQuery: '',
            })
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockGetUserDocumentsAndFolders).toHaveBeenCalledWith(1, {
            page: 1,
            limit: 10,
        });
        expect(mockSearchUserDocumentsAndFolders).not.toHaveBeenCalled();

        expect(result.current.items).toHaveLength(4);
        expect(result.current.items[0].type).toBe('folder');
        expect(result.current.items[0].id).toBe(1);
        expect(result.current.items[1].type).toBe('folder');
        expect(result.current.items[1].id).toBe(2);
        expect(result.current.items[2].type).toBe('document');
        expect(result.current.items[2].id).toBe(1);
        expect(result.current.items[3].type).toBe('document');
        expect(result.current.items[3].id).toBe(2);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.error).toBe(null);
    });

    it('should fetch documents and folders with search query', async () => {
        mockSearchUserDocumentsAndFolders.mockResolvedValue({
            ...mockResponse,
            documents: [mockDocuments[0]],
            folders: [],
            documentsTotal: 1,
            foldersTotal: 0,
            total: 1,
        });

        const { result } = renderHook(() =>
            useDocumentsAndFolders({
                userId: 1,
                page: 1,
                rowsPerPage: 10,
                searchQuery: 'Document 1',
            })
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockSearchUserDocumentsAndFolders).toHaveBeenCalledWith(1, {
            search: 'Document 1',
            page: 1,
            limit: 10,
        });
        expect(mockGetUserDocumentsAndFolders).not.toHaveBeenCalled();

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].type).toBe('document');
        expect(result.current.items[0].id).toBe(1);
    });

    it('should handle empty search query as no search', async () => {
        mockGetUserDocumentsAndFolders.mockResolvedValue(mockResponse);

        const { result } = renderHook(() =>
            useDocumentsAndFolders({
                userId: 1,
                page: 1,
                rowsPerPage: 10,
                searchQuery: '   ',
            })
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockGetUserDocumentsAndFolders).toHaveBeenCalled();
        expect(mockSearchUserDocumentsAndFolders).not.toHaveBeenCalled();
    });

    it('should sort items correctly - (folders first, then by date descending)', async () => {
        mockGetUserDocumentsAndFolders.mockResolvedValue(mockResponse);

        const { result } = renderHook(() =>
            useDocumentsAndFolders({
                userId: 1,
                page: 1,
                rowsPerPage: 10,
                searchQuery: '',
            })
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const items = result.current.items;

        expect(items[0].type).toBe('folder');
        expect(items[1].type).toBe('folder');
        expect(items[2].type).toBe('document');
        expect(items[3].type).toBe('document');

        expect(items[0].id).toBe(1);
        expect(items[1].id).toBe(2);

        expect(items[2].id).toBe(1);
        expect(items[3].id).toBe(2);
    });

    it('should handle API errors', async () => {
        const errorMessage = 'Failed to fetch documents';
        mockGetUserDocumentsAndFolders.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() =>
            useDocumentsAndFolders({
                userId: 1,
                page: 1,
                rowsPerPage: 10,
                searchQuery: '',
            })
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.items).toEqual([]);
        expect(result.current.totalPages).toBe(1);
    });

    it('should handle null userId', () => {
        const { result } = renderHook(() =>
            useDocumentsAndFolders({
                userId: null,
                page: 1,
                rowsPerPage: 10,
                searchQuery: '',
            })
        );

        expect(mockGetUserDocumentsAndFolders).not.toHaveBeenCalled();
        expect(result.current.items).toEqual([]);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.error).toBe(null);
    });

    it('should refetch data when fetchData is called', async () => {
        mockGetUserDocumentsAndFolders.mockResolvedValue(mockResponse);

        const { result } = renderHook(() =>
            useDocumentsAndFolders({
                userId: 1,
                page: 1,
                rowsPerPage: 10,
                searchQuery: '',
            })
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockGetUserDocumentsAndFolders).toHaveBeenCalledTimes(1);

        await result.current.fetchData();
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockGetUserDocumentsAndFolders).toHaveBeenCalledTimes(2);
    });

    it('should handle pagination parameters correctly', async () => {
        mockGetUserDocumentsAndFolders.mockResolvedValue({
            ...mockResponse,
            page: 2,
            limit: 25,
            totalPages: 2,
        });

        const { result } = renderHook(() =>
            useDocumentsAndFolders({
                userId: 1,
                page: 2,
                rowsPerPage: 25,
                searchQuery: '',
            })
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockGetUserDocumentsAndFolders).toHaveBeenCalledWith(1, {
            page: 2,
            limit: 25,
        });
        expect(result.current.totalPages).toBe(2);
    });

    it('should refetch when userId changes', async () => {
        mockGetUserDocumentsAndFolders.mockResolvedValue(mockResponse);

        const { result, rerender } = renderHook(
            (props: { userId: number | null }) =>
                useDocumentsAndFolders({
                    userId: props.userId,
                    page: 1,
                    rowsPerPage: 10,
                    searchQuery: '',
                }),
            {
                initialProps: { userId: null },
            }
        );
        expect(mockGetUserDocumentsAndFolders).not.toHaveBeenCalled();

        (rerender as any)({ userId: 1 });
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockGetUserDocumentsAndFolders).toHaveBeenCalledWith(1, {
            page: 1,
            limit: 10,
        });
    });

    it('should handle empty response and reflect correct totalPages', async () => {
        mockGetUserDocumentsAndFolders.mockResolvedValue({
            success: true,
            documents: [],
            folders: [],
            documentsTotal: 0,
            foldersTotal: 0,
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
        });

        const { result } = renderHook(() =>
            useDocumentsAndFolders({
                userId: 1,
                page: 1,
                rowsPerPage: 10,
                searchQuery: '',
            })
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.items).toEqual([]);
        expect(result.current.totalPages).toBe(1);
    });

    it('should handle response with missing totalPages', async () => {
        mockGetUserDocumentsAndFolders.mockResolvedValue({
            success: true,
            documents: mockDocuments,
            folders: mockFolders,
            documentsTotal: 2,
            foldersTotal: 2,
            total: 4,
            page: 1,
            limit: 10,
        } as any);

        const { result } = renderHook(() =>
            useDocumentsAndFolders({
                userId: 1,
                page: 1,
                rowsPerPage: 10,
                searchQuery: '',
            })
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.totalPages).toBe(1);
    });

    it('should add type field to documents and folders', async () => {
        mockGetUserDocumentsAndFolders.mockResolvedValue(mockResponse);

        const { result } = renderHook(() =>
            useDocumentsAndFolders({
                userId: 1,
                page: 1,
                rowsPerPage: 10,
                searchQuery: '',
            })
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const items = result.current.items;
        const folderItem = items.find((item) => item.id === 1 && item.type === 'folder');
        const documentItem = items.find((item) => item.id === 1 && item.type === 'document');

        expect(folderItem).toBeDefined();
        expect(folderItem?.type).toBe('folder');
        expect(documentItem).toBeDefined();
        expect(documentItem?.type).toBe('document');
    });
});

