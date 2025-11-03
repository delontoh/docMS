import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteFolderModal from './DeleteFolderModal';

describe('DeleteFolderModal', () => {
    const mockOnClose = jest.fn();
    const mockOnConfirm = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render single folder delete confirmation', () => {
        render(
            <DeleteFolderModal
                open={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                folderName="Test Folder"
            />
        );

        expect(screen.getByTestId('delete-folder-modal')).toBeInTheDocument();
        expect(screen.getByTestId('delete-folder-modal-title')).toHaveTextContent('Delete Folder');
        expect(screen.getByTestId('delete-folder-single-confirmation-text')).toHaveTextContent(/Are you sure you want to delete this folder "Test Folder"/);
        expect(screen.getByTestId('delete-folder-single-info-alert')).toBeInTheDocument();
        expect(screen.getByTestId('delete-folder-cancel-button')).toBeInTheDocument();
        expect(screen.getByTestId('delete-folder-confirm-button')).toBeInTheDocument();
    });

    it('should render bulk delete confirmation', () => {
        const folderNames = ['Folder 1', 'Folder 2', 'Folder 3'];
        
        render(
            <DeleteFolderModal
                open={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                folderCount={3}
                folderNames={folderNames}
            />
        );

        expect(screen.getByTestId('delete-folder-modal')).toBeInTheDocument();
        expect(screen.getByTestId('delete-folder-modal-title')).toHaveTextContent('Delete Folders');
        expect(screen.getByTestId('delete-folder-bulk-confirmation-text')).toHaveTextContent(/Are you sure you want to delete 3 folder\(s\)\?/);
        expect(screen.getByTestId('delete-folder-names-header')).toHaveTextContent(/Folders to delete:/);
        folderNames.forEach((name, index) => {
            expect(screen.getByTestId(`delete-folder-name-${index}`)).toHaveTextContent(`• ${name}`);
        });
        expect(screen.getByTestId('delete-folder-bulk-info-alert')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
        render(
            <DeleteFolderModal
                open={false}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                folderName="Test Folder"
            />
        );

        expect(screen.queryByTestId('delete-folder-modal')).not.toBeInTheDocument();
    });

    it('should call onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        
        render(
            <DeleteFolderModal
                open={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                folderName="Test Folder"
            />
        );

        const cancelButton = screen.getByTestId('delete-folder-cancel-button');
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should call onConfirm when delete button is clicked', async () => {
        const user = userEvent.setup();
        
        render(
            <DeleteFolderModal
                open={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                folderName="Test Folder"
            />
        );

        const deleteButton = screen.getByTestId('delete-folder-confirm-button');
        await user.click(deleteButton);

        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle bulk delete without folder names list', () => {
        render(
            <DeleteFolderModal
                open={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                folderCount={2}
            />
        );

        expect(screen.getByTestId('delete-folder-modal')).toBeInTheDocument();
        expect(screen.getByTestId('delete-folder-modal-title')).toHaveTextContent('Delete Folders');
        expect(screen.getByTestId('delete-folder-bulk-confirmation-text')).toHaveTextContent(/Are you sure you want to delete 2 folder\(s\)\?/);
        expect(screen.queryByTestId('delete-folder-names-header')).not.toBeInTheDocument();
    });

    it('should display correct info message for single folder', () => {
        render(
            <DeleteFolderModal
                open={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                folderName="My Folder"
            />
        );

        expect(screen.getByTestId('delete-folder-single-info-alert')).toHaveTextContent(/The documents will be removed from this folder but will remain in your documents list/);
    });

    it('should display correct info message for bulk delete', () => {
        render(
            <DeleteFolderModal
                open={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                folderCount={3}
                folderNames={['Folder 1', 'Folder 2', 'Folder 3']}
            />
        );

        expect(screen.getByTestId('delete-folder-bulk-info-alert')).toHaveTextContent(/The documents will be removed from these folders but will remain in your documents list/);
    });
});

