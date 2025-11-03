import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewFolderModal from './ViewFolderModal';
import * as folderApi from '@/lib/api/folder.api';

//Mock folder API
jest.mock('@/lib/api/folder.api');
const mockGetFolderById = folderApi.getFolderById as any;

describe('ViewFolderModal', () => {
    const mockOnClose = jest.fn();
    const folderId = 1;

    const mockFolder = {
        id: 1,
        name: 'Test Folder',
        file_type: 'folder',
        folders_user_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
        },
        documents: [
            {
                id: 1,
                name: 'Document 1.pdf',
                file_size: '100 KB',
                created_at: '2024-01-02T00:00:00Z',
            },
            {
                id: 2,
                name: 'Document 2.docx',
                file_size: '200 KB',
                created_at: '2024-01-03T00:00:00Z',
            },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render modal when open', () => {
        mockGetFolderById.mockResolvedValue({
            success: true,
            data: mockFolder,
        });

        render(
            <ViewFolderModal
                open={true}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        expect(screen.getByTestId('view-folder-modal')).toBeInTheDocument();
        expect(screen.getByTestId('view-folder-modal-title')).toHaveTextContent('Folder Details');
    });

    it('should not render when closed', () => {
        render(
            <ViewFolderModal
                open={false}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        expect(screen.queryByTestId('view-folder-modal')).not.toBeInTheDocument();
    });

    it('should fetch folder data when modal opens', async () => {
        mockGetFolderById.mockResolvedValue({
            success: true,
            data: mockFolder,
        });

        render(
            <ViewFolderModal
                open={true}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        await waitFor(() => {
            expect(mockGetFolderById).toHaveBeenCalledWith(folderId);
        });
    });

    it('should display loading state while fetching folder', () => {
        mockGetFolderById.mockImplementation(() => new Promise(() => {})); // Never resolves

        render(
            <ViewFolderModal
                open={true}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        expect(screen.getByTestId('view-folder-loading')).toBeInTheDocument();
    });

    it('should display folder information when loaded', async () => {
        mockGetFolderById.mockResolvedValue({
            success: true,
            data: mockFolder,
        });

        render(
            <ViewFolderModal
                open={true}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('view-folder-modal-title')).toHaveTextContent('Test Folder');
        });

        expect(screen.getByTestId('view-folder-created-by')).toHaveTextContent(/created by: test user/i);
        expect(screen.getByTestId('view-folder-created-on')).toHaveTextContent(/created on:/i);
    });

    it('should display documents in folder', async () => {
        mockGetFolderById.mockResolvedValue({
            success: true,
            data: mockFolder,
        });

        render(
            <ViewFolderModal
                open={true}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('view-folder-documents-count')).toHaveTextContent(/\(2\) document\(s\) in this folder/i);
        });

        expect(screen.getByText('Document 1.pdf')).toBeInTheDocument();
        expect(screen.getByText('Document 2.docx')).toBeInTheDocument();
        expect(screen.getByText(/size: 100 kb/i)).toBeInTheDocument();
        expect(screen.getByText(/size: 200 kb/i)).toBeInTheDocument();
    });

    it('should display message when folder has no documents', async () => {
        const emptyFolder = {
            ...mockFolder,
            documents: [],
        };

        mockGetFolderById.mockResolvedValue({
            success: true,
            data: emptyFolder,
        });

        render(
            <ViewFolderModal
                open={true}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/no documents in this folder/i)).toBeInTheDocument();
        });

        expect(screen.queryByText('Document 1.pdf')).not.toBeInTheDocument();
    });

    it('should display error when failed to fetch folder', async () => {
        mockGetFolderById.mockRejectedValue(new Error('Failed to load folder'));

        render(
            <ViewFolderModal
                open={true}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/failed to load folder/i)).toBeInTheDocument();
        });
    });

    it('should display error when API returns unsuccessful response', async () => {
        mockGetFolderById.mockResolvedValue({
            success: false,
            data: null as any,
        });

        render(
            <ViewFolderModal
                open={true}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/failed to load folder/i)).toBeInTheDocument();
        });
    });

    it('should call onClose when close button is clicked', async () => {
        const user = userEvent.setup();

        mockGetFolderById.mockResolvedValue({
            success: true,
            data: mockFolder,
        });

        render(
            <ViewFolderModal
                open={true}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Test Folder')).toBeInTheDocument();
        });

        const closeButton = screen.getByTestId('view-folder-close-button');
        await user.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should reset folder data when modal closes and reopens', async () => {
        mockGetFolderById.mockResolvedValue({
            success: true,
            data: mockFolder,
        });

        const { rerender } = render(
            <ViewFolderModal
                open={true}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Test Folder')).toBeInTheDocument();
        });

        rerender(
            <ViewFolderModal
                open={false} //Close modal
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        rerender(
            <ViewFolderModal
                open={true}  //Reopen modal
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        // Should fetch again
        await waitFor(() => {
            expect(mockGetFolderById).toHaveBeenCalledTimes(2);
        });
    });

    it('should handle unknown creator name', async () => {
        const folderWithoutCreator = {
            ...mockFolder,
            created_by: null,
        };

        mockGetFolderById.mockResolvedValue({
            success: true,
            data: folderWithoutCreator as any,
        });

        render(
            <ViewFolderModal
                open={true}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/created by: unknown/i)).toBeInTheDocument();
        });
    });

    it('should handle folder without created_at date', async () => {
        const folderWithoutDate = {
            ...mockFolder,
            created_at: null,
        };

        mockGetFolderById.mockResolvedValue({
            success: true,
            data: folderWithoutDate as any,
        });

        render(
            <ViewFolderModal
                open={true}
                onClose={mockOnClose}
                folderId={folderId}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/created on: unknown/i)).toBeInTheDocument();
        });
    });
});

