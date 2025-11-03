import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadModal from './index';
import * as documentApi from '@/lib/api/document.api';

//Mock document API
jest.mock('@/lib/api/document.api');
const mockCreateDocument = documentApi.createDocument as any;
const mockCheckDocumentNamesExist = documentApi.checkDocumentNamesExist as any;

describe('UploadModal', () => {
    const mockOnClose = jest.fn();
    const mockOnUploadSuccess = jest.fn();
    const userId = 1;

    const createMockFile = (name: string, size: number, type: string): File => {
        const file = new File(['content'], name, { type });
        Object.defineProperty(file, 'size', { value: size });
        return file;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockCheckDocumentNamesExist.mockResolvedValue({
            success: true,
            data: { existingNames: [], totalChecked: 0, duplicatesFound: 0 },
        });
    });

    it('should render modal when open', () => {
        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
                onUploadSuccess={mockOnUploadSuccess}
            />
        );

        expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
        expect(screen.getByTestId('upload-modal-title')).toHaveTextContent('Upload');
        expect(screen.getByTestId('upload-drop-zone')).toBeInTheDocument();
        expect(screen.getByTestId('upload-cancel-button')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
        render(
            <UploadModal
                open={false}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();
    });

    it('should accept valid files via file input', async () => {
        const user = userEvent.setup();
        const validFile = createMockFile('test.pdf', 1024 * 1024, 'application/pdf'); // 1MB

        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
        
        await user.upload(fileInput, validFile);
        await waitFor(() => {
            expect(screen.getByTestId('upload-files-list-container')).toBeInTheDocument();
            expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });
    });

    it('should show error message for files with invalid extensions', async () => {
        const user = userEvent.setup();
        const invalidFile = createMockFile('test.txt', 1024, 'text/plain');

        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        const dropZone = screen.getByTestId('upload-drop-zone');
        const fileList = {
            0: invalidFile,
            length: 1,
            item: () => invalidFile,
        } as unknown as FileList;
        const dataTransfer = { files: fileList } as DataTransfer;

        fireEvent.dragOver(dropZone, { dataTransfer });
        fireEvent.drop(dropZone, { dataTransfer });

        await waitFor(() => {
            const errorText = screen.queryByText(/file type \.txt is not allowed/i);
            expect(errorText).toBeInTheDocument();
        });
    });

    it('should reject files exceeding max size', async () => {
        const user = userEvent.setup();
        const largeFile = createMockFile('large.pdf', 6 * 1024 * 1024, 'application/pdf'); // 6MB

        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
        
        await user.upload(fileInput, largeFile);
        await waitFor(() => {
            const fileItem = screen.getByText(/large\.pdf/i).closest('[data-testid^="upload-file-item-"]');
            expect(fileItem).toBeInTheDocument();
            const errorText = fileItem?.querySelector('[data-testid^="upload-error-"]');
            expect(errorText).toHaveTextContent(/file size.*exceeds the maximum limit/i);
        });
    });

    it('should detect duplicate files in upload list', async () => {
        const user = userEvent.setup();
        const file1 = createMockFile('test.pdf', 1024 * 1024, 'application/pdf');
        const file2 = createMockFile('test.pdf', 1024 * 1024, 'application/pdf');

        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
        
        await user.upload(fileInput, file1);
        await waitFor(() => {
            expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });

        await user.upload(fileInput, file2);
        await waitFor(() => {
            const errorText = screen.queryByText(/a file with the name "test.pdf" is already in the upload list/i);
            expect(errorText).toBeInTheDocument();
        });
    });

    it('should remove file from list when delete button is clicked', async () => {
        const user = userEvent.setup();
        const validFile = createMockFile('test.pdf', 1024 * 1024, 'application/pdf');

        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
        
        await user.upload(fileInput, validFile);
        await waitFor(() => {
            expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });
        await waitFor(() => {
            const fileItem = screen.getByText('test.pdf').closest('[data-testid^="upload-file-item-"]');
            expect(fileItem).toBeInTheDocument();
        });
        
        const fileItem = screen.getByText('test.pdf').closest('[data-testid^="upload-file-item-"]');
        const deleteButton = fileItem?.querySelector('[data-testid^="upload-remove-file-"]') as HTMLElement;
        expect(deleteButton).toBeInTheDocument();
        await user.click(deleteButton);

        await waitFor(() => {
            expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
        });
    });

    it('should upload files successfully', async () => {
        const user = userEvent.setup();
        const validFile = createMockFile('test.pdf', 1024 * 1024, 'application/pdf');

        mockCreateDocument.mockResolvedValue({
            success: true,
            data: {
                id: 1,
                name: 'test.pdf',
                file_size: '1024 KB',
                file_type: 'document',
                document_user_id: userId,
                folder_document_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        });

        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
                onUploadSuccess={mockOnUploadSuccess}
            />
        );

        const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
        
        await user.upload(fileInput, validFile);
        await waitFor(() => {
            expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });

        const uploadButton = screen.getByTestId('upload-submit-button');
        await user.click(uploadButton);

        await waitFor(() => {
            expect(mockCheckDocumentNamesExist).toHaveBeenCalled();
            expect(mockCreateDocument).toHaveBeenCalledWith({
                name: 'test.pdf',
                file_size: expect.stringContaining('KB'),
                document_user_id: userId,
                folder_document_id: null,
            });
        });

        await waitFor(() => {
            const fileItem = screen.getByText('test.pdf').closest('[data-testid^="upload-file-item-"]');
            expect(fileItem?.querySelector('[data-testid^="upload-success-"]')).toBeInTheDocument();
        });

        expect(mockOnUploadSuccess).toHaveBeenCalled();
    });

    it('should check for duplicate document names before upload', async () => {
        const user = userEvent.setup();
        const validFile = createMockFile('existing.pdf', 1024 * 1024, 'application/pdf');

        mockCheckDocumentNamesExist.mockResolvedValue({
            success: true,
            data: { existingNames: ['existing.pdf'], totalChecked: 1, duplicatesFound: 1 },
        });

        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
        
            await user.upload(fileInput, validFile);
            await waitFor(() => {
                expect(screen.getByText('existing.pdf')).toBeInTheDocument();
            });

            const uploadButton = screen.getByTestId('upload-submit-button');
            await user.click(uploadButton);

            await waitFor(() => {
                expect(mockCheckDocumentNamesExist).toHaveBeenCalledWith(userId, ['existing.pdf']);
            });

            await waitFor(() => {
                const fileItem = screen.getByText('existing.pdf').closest('[data-testid^="upload-file-item-"]');
                const errorText = fileItem?.querySelector('[data-testid^="upload-error-"]');
                expect(errorText).toHaveTextContent(/a document with the name "existing.pdf" already exists/i);
            });

            expect(mockCreateDocument).not.toHaveBeenCalled();
    });

    it('should handle upload failure', async () => {
        const user = userEvent.setup();
        const validFile = createMockFile('test.pdf', 1024 * 1024, 'application/pdf');

        mockCreateDocument.mockRejectedValue({ error: 'Upload failed' });

        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
        
        await user.upload(fileInput, validFile);
        await waitFor(() => {
            expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });

        const uploadButton = screen.getByTestId('upload-submit-button');
        await user.click(uploadButton);

        await waitFor(() => {
            const fileItem = screen.getByText('test.pdf').closest('[data-testid^="upload-file-item-"]');
            const errorText = fileItem?.querySelector('[data-testid^="upload-error-"]');
            expect(errorText).toHaveTextContent(/upload failed/i);
        });
    });

    it('should reset state when modal closes', async () => {
        const user = userEvent.setup();
        const validFile = createMockFile('test.pdf', 1024 * 1024, 'application/pdf');

        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
        
        await user.upload(fileInput, validFile);
        await waitFor(() => {
            expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });

        const cancelButton = screen.getByTestId('upload-cancel-button');
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalled();

        const { rerender } = render(
            <UploadModal
                open={false}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        rerender(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    });

    it('should display upload results after completion', async () => {
        const user = userEvent.setup();
        const validFile = createMockFile('test.pdf', 1024 * 1024, 'application/pdf');

        mockCreateDocument.mockResolvedValue({
            success: true,
            data: {
                id: 1,
                name: 'test.pdf',
                file_size: '1024 KB',
                file_type: 'document',
                document_user_id: userId,
                folder_document_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        });

        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
        
        await user.upload(fileInput, validFile);

        const uploadButton = screen.getByTestId('upload-submit-button');
        await user.click(uploadButton);

        await waitFor(() => {
            expect(screen.getByTestId('upload-success-alert')).toHaveTextContent(/1 file\(s\) uploaded successfully/i);
        });
    });

    it('should disable upload button when no valid files', () => {
        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        const uploadButton = screen.queryByTestId('upload-submit-button');
        expect(uploadButton).not.toBeInTheDocument();
    });

    it('should show continue button after successful uploads', async () => {
        const user = userEvent.setup();
        const validFile = createMockFile('test.pdf', 1024 * 1024, 'application/pdf');

        mockCreateDocument.mockResolvedValue({
            success: true,
            data: {
                id: 1,
                name: 'test.pdf',
                file_size: '1024 KB',
                file_type: 'document',
                document_user_id: userId,
                folder_document_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        });

        render(
            <UploadModal
                open={true}
                onClose={mockOnClose}
                userId={userId}
            />
        );

        const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
        
        await user.upload(fileInput, validFile);

        const uploadButton = screen.getByTestId('upload-submit-button');
        await user.click(uploadButton);

        await waitFor(() => {
            expect(screen.getByTestId('upload-done-button')).toBeInTheDocument();
        });
    });
});

