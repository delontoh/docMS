import { Request, Response } from 'express';
import {
    createDocument,
    deleteDocument,
    deleteManyDocuments,
    checkDocumentNamesExist,
    getDocumentsWithoutFolders,
    assignDocumentsToFolder,
} from './documents.controller';
import * as documentsModel from '@models/documents/documents.model';

//Mock documents model
jest.mock('@models/documents/documents.model');

const createMockRequest = (overrides?: Partial<Request>): Partial<Request> => ({
    body: {},
    params: {},
    query: {},
    ...overrides,
});

const createMockResponse = (): Partial<Response> => {
    const res = {} as Partial<Response>;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Documents Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createDocument', () => {
        it('should create a document successfully with all required fields', async () => {
            const mockDocument = {
                id: 1,
                name: 'test-document.pdf',
                file_size: '100 KB',
                file_type: 'document',
                document_user_id: 1,
                folder_document_id: null,
                created_at: new Date(),
                updated_at: new Date(),
                created_by: { id: 1, name: 'Test User', email: 'test@example.com' },
                belong_to_folder: null,
            };

            (documentsModel.createDocument as jest.Mock).mockResolvedValue(mockDocument);

            const req = createMockRequest({
                body: {
                    name: 'test-document.pdf',
                    file_size: '100 KB',
                    document_user_id: 1,
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createDocument(req, res);

            expect(documentsModel.createDocument).toHaveBeenCalledWith({
                name: 'test-document.pdf',
                file_size: '100 KB',
                document_user_id: 1,
                folder_document_id: null,
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Document created successfully',
                data: mockDocument,
            });
        });

        it('should create a document with folder assignment', async () => {
            const mockDocument = {
                id: 1,
                name: 'test-document.pdf',
                file_size: '100 KB',
                file_type: 'document',
                document_user_id: 1,
                folder_document_id: 5,
                created_at: new Date(),
                updated_at: new Date(),
                created_by: { id: 1, name: 'Test User', email: 'test@example.com' },
                belong_to_folder: { id: 5, name: 'Test Folder' },
            };

            (documentsModel.createDocument as jest.Mock).mockResolvedValue(mockDocument);

            const req = createMockRequest({
                body: {
                    name: 'test-document.pdf',
                    file_size: '100 KB',
                    document_user_id: 1,
                    folder_document_id: 5,
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createDocument(req, res);

            expect(documentsModel.createDocument).toHaveBeenCalledWith({
                name: 'test-document.pdf',
                file_size: '100 KB',
                document_user_id: 1,
                folder_document_id: 5,
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Document created successfully',
                data: mockDocument,
            });
        });

        it('should return error when required fields are missing', async () => {
            const req = createMockRequest({
                body: {
                    name: 'test-document.pdf',
                    // Missing file_size and document_user_id
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createDocument(req, res);

            expect(documentsModel.createDocument).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Missing required fields: { name, file_size, document_user_id }',
            });
        });

        it('should handle duplicate document name error', async () => {
            const error = new Error('Unique constraint failed on the fields: (`name`,`document_user_id`)');
            (documentsModel.createDocument as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                body: {
                    name: 'existing-document.pdf',
                    file_size: '100 KB',
                    document_user_id: 1,
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createDocument(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to create document',
                error: expect.stringContaining('already exists'),
            });
        });

        it('should handle generic errors', async () => {
            const error = new Error('Database connection failed');
            (documentsModel.createDocument as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                body: {
                    name: 'test-document.pdf',
                    file_size: '100 KB',
                    document_user_id: 1,
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createDocument(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to create document',
                error: 'Database connection failed',
            });
        });

        it('should return error when file size format is invalid', async () => {
            const req = createMockRequest({
                body: {
                    name: 'test-document.pdf',
                    file_size: '100 MB',
                    document_user_id: 1,
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createDocument(req, res);

            expect(documentsModel.createDocument).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid file size format',
            });
        });

        it('should return error when file size exceeds max limit', async () => {
            const req = createMockRequest({
                body: {
                    name: 'test-document.pdf',
                    file_size: '5121 KB', //>5MB
                    document_user_id: 1,
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createDocument(req, res);

            expect(documentsModel.createDocument).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'File size must be between 1 and 5120 KB (5MB)',
            });
        });

        it('should accept file size at max limit', async () => {
            const mockDocument = {
                id: 1,
                name: 'test-document.pdf',
                file_size: '5120 KB',
                file_type: 'document',
                document_user_id: 1,
                folder_document_id: null,
                created_at: new Date(),
                updated_at: new Date(),
                created_by: { id: 1, name: 'Test User', email: 'test@example.com' },
                belong_to_folder: null,
            };

            (documentsModel.createDocument as jest.Mock).mockResolvedValue(mockDocument);

            const req = createMockRequest({
                body: {
                    name: 'test-document.pdf',
                    file_size: '5120 KB',
                    document_user_id: 1,
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createDocument(req, res);

            expect(documentsModel.createDocument).toHaveBeenCalledWith({
                name: 'test-document.pdf',
                file_size: '5120 KB',
                document_user_id: 1,
                folder_document_id: null,
            });
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return error when file size is NaN', async () => {
            const req = createMockRequest({
                body: {
                    name: 'test-document.pdf',
                    file_size: 'abc KB',
                    document_user_id: 1,
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createDocument(req, res);

            expect(documentsModel.createDocument).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid file size format',
            });
        });

        it('should return error when file size is 0 KB', async () => {
            const req = createMockRequest({
                body: {
                    name: 'test-document.pdf',
                    file_size: '0 KB',
                    document_user_id: 1,
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createDocument(req, res);

            expect(documentsModel.createDocument).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'File is empty. File size must be greater than 0 KB.',
            });
        });
    });

    describe('deleteDocument', () => {
        it('should delete a document successfully', async () => {
            (documentsModel.deleteDocument as jest.Mock).mockResolvedValue(undefined);

            const req = createMockRequest({
                params: { id: '1' },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteDocument(req, res);

            expect(documentsModel.deleteDocument).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Document deleted successfully',
            });
        });

        it('should return error when document ID is invalid', async () => {
            const req = createMockRequest({
                params: { id: 'invalid' },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteDocument(req, res);

            expect(documentsModel.deleteDocument).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid document ID',
            });
        });

        it('should handle document not found error', async () => {
            const error = new Error('Record to delete does not exist');
            (documentsModel.deleteDocument as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                params: { id: '999' },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteDocument(req, res);

            expect(documentsModel.deleteDocument).toHaveBeenCalledWith(999);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Document not found',
            });
        });

        it('should handle generic errors', async () => {
            const error = new Error('Database error');
            (documentsModel.deleteDocument as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                params: { id: '1' },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteDocument(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to delete document',
                error: 'Database error',
            });
        });
    });

    describe('deleteManyDocuments', () => {
        it('should delete multiple documents successfully', async () => {
            (documentsModel.deleteManyDocuments as jest.Mock).mockResolvedValue({ count: 3 });

            const req = createMockRequest({
                body: { ids: [1, 2, 3] },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteManyDocuments(req, res);

            expect(documentsModel.deleteManyDocuments).toHaveBeenCalledWith([1, 2, 3]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: '3 document(s) deleted successfully',
                data: { deletedCount: 3 },
            });
        });

        it('should convert string IDs to numbers', async () => {
            (documentsModel.deleteManyDocuments as jest.Mock).mockResolvedValue({ count: 2 });

            const req = createMockRequest({
                body: { ids: ['1', '2', '3'] },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteManyDocuments(req, res);

            expect(documentsModel.deleteManyDocuments).toHaveBeenCalledWith([1, 2, 3]);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should filter out invalid IDs', async () => {
            (documentsModel.deleteManyDocuments as jest.Mock).mockResolvedValue({ count: 2 });

            const req = createMockRequest({
                body: { ids: [1, 'invalid', 2, NaN] },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteManyDocuments(req, res);

            expect(documentsModel.deleteManyDocuments).toHaveBeenCalledWith([1, 2]);
        });

        it('should return error when ids is not an array', async () => {
            const req = createMockRequest({
                body: { ids: 'not-an-array' },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteManyDocuments(req, res);

            expect(documentsModel.deleteManyDocuments).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid IDs array provided',
            });
        });

        it('should return error when ids array is empty', async () => {
            const req = createMockRequest({
                body: { ids: [] },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteManyDocuments(req, res);

            expect(documentsModel.deleteManyDocuments).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid IDs array provided',
            });
        });

        it('should return error when no valid IDs provided', async () => {
            const req = createMockRequest({
                body: { ids: ['invalid', 'also-invalid'] },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteManyDocuments(req, res);

            expect(documentsModel.deleteManyDocuments).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No valid IDs provided',
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            (documentsModel.deleteManyDocuments as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                body: { ids: [1, 2, 3] },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteManyDocuments(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to delete documents',
                error: 'Database error',
            });
        });
    });

    describe('checkDocumentNamesExist', () => {
        it('should check document names successfully', async () => {
            (documentsModel.checkDocumentNamesExist as jest.Mock).mockResolvedValue([
                'existing-file.pdf',
            ]);

            const req = createMockRequest({
                params: { userId: '1' },
                body: { names: ['existing-file.pdf', 'new-file.pdf'] },
            }) as Request;
            const res = createMockResponse() as Response;

            await checkDocumentNamesExist(req, res);

            expect(documentsModel.checkDocumentNamesExist).toHaveBeenCalledWith(1, [
                'existing-file.pdf',
                'new-file.pdf',
            ]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Document names checked successfully',
                data: {
                    existingNames: ['existing-file.pdf'],
                    totalChecked: 2,
                    duplicatesFound: 1,
                },
            });
        });

        it('should return error when user ID is invalid', async () => {
            const req = createMockRequest({
                params: { userId: 'invalid' },
                body: { names: ['file.pdf'] },
            }) as Request;
            const res = createMockResponse() as Response;

            await checkDocumentNamesExist(req, res);

            expect(documentsModel.checkDocumentNamesExist).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid user ID',
            });
        });

        it('should return error when names is not an array', async () => {
            const req = createMockRequest({
                params: { userId: '1' },
                body: { names: 'not-an-array' },
            }) as Request;
            const res = createMockResponse() as Response;

            await checkDocumentNamesExist(req, res);

            expect(documentsModel.checkDocumentNamesExist).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid names array provided',
            });
        });

        it('should return error when names array is empty', async () => {
            const req = createMockRequest({
                params: { userId: '1' },
                body: { names: [] },
            }) as Request;
            const res = createMockResponse() as Response;

            await checkDocumentNamesExist(req, res);

            expect(documentsModel.checkDocumentNamesExist).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid names array provided',
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            (documentsModel.checkDocumentNamesExist as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                params: { userId: '1' },
                body: { names: ['file.pdf'] },
            }) as Request;
            const res = createMockResponse() as Response;

            await checkDocumentNamesExist(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to check document names',
                error: 'Database error',
            });
        });
    });

    describe('getDocumentsWithoutFolders', () => {
        it('should get documents without folders successfully', async () => {
            const mockDocuments = [
                {
                    id: 1,
                    name: 'document1.pdf',
                    file_size: '100 KB',
                    document_user_id: 1,
                    folder_document_id: null,
                    created_by: { id: 1, name: 'Test User' },
                    belong_to_folder: null,
                },
            ];

            (documentsModel.getDocumentsWithoutFolders as jest.Mock).mockResolvedValue(
                mockDocuments
            );

            const req = createMockRequest({
                params: { userId: '1' },
            }) as Request;
            const res = createMockResponse() as Response;

            await getDocumentsWithoutFolders(req, res);

            expect(documentsModel.getDocumentsWithoutFolders).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Documents retrieved successfully',
                data: mockDocuments,
            });
        });

        it('should return error when user ID is invalid', async () => {
            const req = createMockRequest({
                params: { userId: 'invalid' },
            }) as Request;
            const res = createMockResponse() as Response;

            await getDocumentsWithoutFolders(req, res);

            expect(documentsModel.getDocumentsWithoutFolders).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid user ID',
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            (documentsModel.getDocumentsWithoutFolders as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                params: { userId: '1' },
            }) as Request;
            const res = createMockResponse() as Response;

            await getDocumentsWithoutFolders(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to retrieve documents',
                error: 'Database error',
            });
        });
    });

    describe('assignDocumentsToFolder', () => {
        it('should assign documents to a folder successfully', async () => {
            (documentsModel.updateDocumentsToFolder as jest.Mock).mockResolvedValue({ count: 3 });

            const req = createMockRequest({
                body: { documentIds: [1, 2, 3], folderId: 5 },
            }) as Request;
            const res = createMockResponse() as Response;

            await assignDocumentsToFolder(req, res);

            expect(documentsModel.updateDocumentsToFolder).toHaveBeenCalledWith([1, 2, 3], 5);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: '3 document(s) assigned to folder successfully',
                data: { updatedCount: 3 },
            });
        });

        it('should remove documents from folder when folderId is null', async () => {
            (documentsModel.updateDocumentsToFolder as jest.Mock).mockResolvedValue({ count: 2 });

            const req = createMockRequest({
                body: { documentIds: [1, 2], folderId: null },
            }) as Request;
            const res = createMockResponse() as Response;

            await assignDocumentsToFolder(req, res);

            expect(documentsModel.updateDocumentsToFolder).toHaveBeenCalledWith([1, 2], null);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should convert string IDs to numbers', async () => {
            (documentsModel.updateDocumentsToFolder as jest.Mock).mockResolvedValue({ count: 2 });

            const req = createMockRequest({
                body: { documentIds: ['1', '2'], folderId: '5' },
            }) as Request;
            const res = createMockResponse() as Response;

            await assignDocumentsToFolder(req, res);

            expect(documentsModel.updateDocumentsToFolder).toHaveBeenCalledWith([1, 2], 5);
        });

        it('should return error when documentIds is not an array', async () => {
            const req = createMockRequest({
                body: { documentIds: 'not-an-array', folderId: 5 },
            }) as Request;
            const res = createMockResponse() as Response;

            await assignDocumentsToFolder(req, res);

            expect(documentsModel.updateDocumentsToFolder).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid documentIds array provided',
            });
        });

        it('should return error when documentIds array is empty', async () => {
            const req = createMockRequest({
                body: { documentIds: [], folderId: 5 },
            }) as Request;
            const res = createMockResponse() as Response;

            await assignDocumentsToFolder(req, res);

            expect(documentsModel.updateDocumentsToFolder).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid documentIds array provided',
            });
        });

        it('should return error when no valid document IDs provided', async () => {
            const req = createMockRequest({
                body: { documentIds: ['invalid', 'also-invalid'], folderId: 5 },
            }) as Request;
            const res = createMockResponse() as Response;

            await assignDocumentsToFolder(req, res);

            expect(documentsModel.updateDocumentsToFolder).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No valid document IDs provided',
            });
        });

        it('should return error when folderId is invalid', async () => {
            const req = createMockRequest({
                body: { documentIds: [1, 2, 3], folderId: 'invalid' },
            }) as Request;
            const res = createMockResponse() as Response;

            await assignDocumentsToFolder(req, res);

            expect(documentsModel.updateDocumentsToFolder).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid folder ID',
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            (documentsModel.updateDocumentsToFolder as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                body: { documentIds: [1, 2, 3], folderId: 5 },
            }) as Request;
            const res = createMockResponse() as Response;

            await assignDocumentsToFolder(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to assign documents to folder',
                error: 'Database error',
            });
        });
    });
});

