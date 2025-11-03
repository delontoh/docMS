import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateFolderModal from './index';
import * as folderApi from '@/lib/api/folder.api';
import * as documentApi from '@/lib/api/document.api';

//Mock APIs
jest.mock('@/lib/api/folder.api');
jest.mock('@/lib/api/document.api');

const mockCreateFolder = folderApi.createFolder as any;
const mockCheckFolderNamesExist = folderApi.checkFolderNamesExist as any;
const mockGetDocumentsWithoutFolders = documentApi.getDocumentsWithoutFolders as any;
const mockAssignDocumentsToFolder = documentApi.assignDocumentsToFolder as any;

describe('CreateFolderModal', () => {
    const mockOnClose = jest.fn();
    const mockOnFolderCreated = jest.fn();
    const userId = 1;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetDocumentsWithoutFolders.mockResolvedValue({
            success: true,
            data: [
                { id: 1, name: 'Document 1', file_size: '100 KB', created_at: new Date().toISOString() },
                { id: 2, name: 'Document 2', file_size: '200 KB', created_at: new Date().toISOString() },
            ],
        });
        mockCheckFolderNamesExist.mockResolvedValue({
            success: true,
            data: { existingNames: [], totalChecked: 1, duplicatesFound: 0 },
        });
        mockCreateFolder.mockResolvedValue({
            success: true,
            data: {
                id: 1,
                name: 'New Folder',
                file_type: 'folder',
                folders_user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        });
    });

    it('should render modal when open', async () => {
        render(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
                onFolderCreated={mockOnFolderCreated}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('create-folder-modal')).toBeInTheDocument();
        });

        expect(screen.getByTestId('create-folder-modal-title')).toHaveTextContent('Create Folder');
        expect(screen.getByTestId('create-folder-name-input')).toBeInTheDocument();
        expect(screen.getByTestId('create-folder-documents-select')).toBeInTheDocument();
        expect(screen.getByTestId('create-folder-cancel-button')).toBeInTheDocument();
        expect(screen.getByTestId('create-folder-submit-button')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
        render(
            <CreateFolderModal
                open={false}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        expect(screen.queryByTestId('create-folder-modal')).not.toBeInTheDocument();
    });

    it('should fetch available documents when modal opens', async () => {
        render(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        await waitFor(() => {
            expect(mockGetDocumentsWithoutFolders).toHaveBeenCalledWith(userId);
        });
    });

    it('should disable document select while fetching documents', async () => {
        mockGetDocumentsWithoutFolders.mockImplementation(() => new Promise(() => {}));

        render(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        await waitFor(() => {
            expect(mockGetDocumentsWithoutFolders).toHaveBeenCalled();
        });

        const selectElement = screen.getByTestId('create-folder-documents-select');
        expect(selectElement).toHaveClass('Mui-disabled');
    });

    it('should display message when no documents available', async () => {
        mockGetDocumentsWithoutFolders.mockResolvedValue({
            success: true,
            data: [],
        });

        render(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        await waitFor(() => {
            expect(mockGetDocumentsWithoutFolders).toHaveBeenCalled();
        });

        const selectElement = screen.getByTestId('create-folder-documents-select');
        const selectInput = selectElement.querySelector('[role="combobox"]') || selectElement.querySelector('input') || selectElement;
        
        selectInput.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

        await waitFor(() => {
            const noDocsText = screen.queryByText(/no documents available/i);
            expect(noDocsText).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('should disable create button when folder name is empty', async () => {
        render(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        await waitFor(() => {
            expect(mockGetDocumentsWithoutFolders).toHaveBeenCalled();
        });

        const createButton = screen.getByTestId('create-folder-submit-button');
        expect(createButton).toBeDisabled();
        expect(mockCreateFolder).not.toHaveBeenCalled();
    });

    it('should check for duplicate folder names on input', async () => {
        const user = userEvent.setup();

        render(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        await waitFor(() => {
            expect(mockGetDocumentsWithoutFolders).toHaveBeenCalled();
        });

        const folderNameInput = screen.getByTestId('create-folder-name-input').querySelector('input');
        if (folderNameInput) {
            await user.type(folderNameInput, 'Existing Folder');
        }

        await waitFor(() => {
            expect(mockCheckFolderNamesExist).toHaveBeenCalledWith(userId, ['Existing Folder']);
        }, { timeout: 2000 });
    });

    it('should display error when folder name already exists', async () => {
        const user = userEvent.setup();

        mockCheckFolderNamesExist.mockResolvedValue({
            success: true,
            data: { existingNames: ['Existing Folder'], totalChecked: 1, duplicatesFound: 1 },
        });

        render(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        await waitFor(() => {
            expect(mockGetDocumentsWithoutFolders).toHaveBeenCalled();
        });

        const folderNameInput = screen.getByTestId('create-folder-name-input').querySelector('input');
        if (folderNameInput) {
            await user.type(folderNameInput, 'Existing Folder');
        }

        await waitFor(() => {
            const helperText = screen.queryByText(/a folder with the name "Existing Folder" already exists/i);
            expect(helperText).toBeInTheDocument();
        }, { timeout: 2000 });

        const createButton = screen.getByTestId('create-folder-submit-button');
        expect(createButton).toBeDisabled();
    });

    it('should create folder successfully without documents', async () => {
        const user = userEvent.setup();

        mockCreateFolder.mockResolvedValue({
            success: true,
            data: {
                id: 1,
                name: 'New Folder',
                file_type: 'folder',
                folders_user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        });

        render(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
                onFolderCreated={mockOnFolderCreated}
            />
        );

        const folderNameInput = screen.getByTestId('create-folder-name-input').querySelector('input');
        if (folderNameInput) {
            await user.type(folderNameInput, 'New Folder');
        }

        await waitFor(() => {
            expect(mockCheckFolderNamesExist).toHaveBeenCalled();
        }, { timeout: 2000 });

        await waitFor(() => {
            const createButton = screen.getByTestId('create-folder-submit-button');
            expect(createButton).not.toBeDisabled();
        });

        const createButton = screen.getByTestId('create-folder-submit-button');
        await user.click(createButton);

        await waitFor(() => {
            expect(mockCreateFolder).toHaveBeenCalledWith({
                name: 'New Folder',
                folders_user_id: userId,
            });
        });

        expect(mockAssignDocumentsToFolder).not.toHaveBeenCalled();
        expect(mockOnFolderCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should create folder with assigned documents if selected', async () => {
        const user = userEvent.setup();

        mockCreateFolder.mockResolvedValue({
            success: true,
            data: {
                id: 1,
                name: 'New Folder',
                file_type: 'folder',
                folders_user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        });

        mockAssignDocumentsToFolder.mockResolvedValue({
            success: true,
            message: 'Documents assigned',
            data: { updatedCount: 2 },
        });

        render(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
                onFolderCreated={mockOnFolderCreated}
            />
        );

        await waitFor(() => {
            expect(mockGetDocumentsWithoutFolders).toHaveBeenCalled();
        });

        const folderNameInput = screen.getByTestId('create-folder-name-input').querySelector('input');
        if (folderNameInput) {
            await user.type(folderNameInput, 'New Folder');
        }

        await waitFor(() => {
            expect(mockCheckFolderNamesExist).toHaveBeenCalled();
        }, { timeout: 2000 });

        const selectElement = screen.getByTestId('create-folder-documents-select');
        const selectInput = selectElement.querySelector('[role="combobox"]') || selectElement.querySelector('input') || selectElement;
        
        selectInput.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

        await waitFor(() => {
            const document1Option = screen.getByRole('option', { name: 'Document 1' });
            expect(document1Option).toBeInTheDocument();
        }, { timeout: 2000 });

        const document1Option = screen.getByRole('option', { name: 'Document 1' });
        await user.click(document1Option);

        const document2Option = screen.getByRole('option', { name: 'Document 2' });
        await user.click(document2Option);

        await user.keyboard('{Escape}');

        await waitFor(() => {
            const createButton = screen.getByTestId('create-folder-submit-button');
            expect(createButton).not.toBeDisabled();
        });

        const createButton = screen.getByTestId('create-folder-submit-button');
        await user.click(createButton);

        await waitFor(() => {
            expect(mockCreateFolder).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(mockAssignDocumentsToFolder).toHaveBeenCalledWith([1, 2], 1);
        });

        expect(mockOnFolderCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should display error when folder creation fails', async () => {
        const user = userEvent.setup();

        mockCreateFolder.mockRejectedValue({ error: 'Failed to create folder' });

        render(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        const folderNameInput = screen.getByTestId('create-folder-name-input').querySelector('input');
        if (folderNameInput) {
            await user.type(folderNameInput, 'New Folder');
        }

        await waitFor(() => {
            expect(mockCheckFolderNamesExist).toHaveBeenCalled();
        }, { timeout: 2000 });

        await waitFor(() => {
            const createButton = screen.getByTestId('create-folder-submit-button');
            expect(createButton).not.toBeDisabled();
        });

        const createButton = screen.getByTestId('create-folder-submit-button');
        await user.click(createButton);

        await waitFor(() => {
            expect(screen.getByTestId('create-folder-error-alert')).toHaveTextContent(/failed to create folder/i);
        });

        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should reset form when closed', async () => {
        const user = userEvent.setup();

        const { rerender } = render(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        await waitFor(() => {
            expect(mockGetDocumentsWithoutFolders).toHaveBeenCalled();
        });

        const folderNameInput = screen.getByTestId('create-folder-name-input').querySelector('input');
        if (folderNameInput) {
            await user.type(folderNameInput, 'Test Folder');
        }

        const cancelButton = screen.getByTestId('create-folder-cancel-button');
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalled();

        rerender(
            <CreateFolderModal
                open={false}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        rerender(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        await waitFor(() => {
            const newFolderNameInput = screen.getByTestId('create-folder-name-input').querySelector('input');
            expect(newFolderNameInput).toBeInTheDocument();
            expect(newFolderNameInput).toHaveValue('');
        }, { timeout: 2000 });
    });

    it('should disable create button when folder name input has error', async () => {
        const user = userEvent.setup();

        mockCheckFolderNamesExist.mockResolvedValue({
            success: true,
            data: { existingNames: ['Existing Folder'], totalChecked: 1, duplicatesFound: 1 },
        });

        render(
            <CreateFolderModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        await waitFor(() => {
            expect(mockGetDocumentsWithoutFolders).toHaveBeenCalled();
        });

        const folderNameInput = screen.getByTestId('create-folder-name-input').querySelector('input');
        if (folderNameInput) {
            await user.type(folderNameInput, 'Existing Folder');
        }

        await waitFor(() => {
            const createButton = screen.getByTestId('create-folder-submit-button');
            expect(createButton).toBeDisabled();
        }, { timeout: 2000 });
    });
});

