import {
    createDocument,
    deleteDocument,
    deleteManyDocuments,
    checkDocumentNamesExist,
    getDocumentsWithoutFolders,
    updateDocumentsToFolder,
} from './documents.model';
import { PrismaClient } from '@prisma/client';
import { mockPrisma } from '../../__mocks__/@prisma/client';

//Mock Prisma
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrismaInstance = new PrismaClient() as any as typeof mockPrisma;

describe('Documents Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createDocument', () => {
        it('should create a document with all required fields', async () => {
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

            mockPrismaInstance.document.create.mockResolvedValue(mockDocument);

            const input = {
                name: 'test-document.pdf',
                file_size: '100 KB',
                document_user_id: 1,
            };

            const result = await createDocument(input);

            expect(mockPrismaInstance.document.create).toHaveBeenCalledWith({
                data: {
                    name: 'test-document.pdf',
                    file_size: '100 KB',
                    file_type: 'document',
                    document_user_id: 1,
                    folder_document_id: null,
                },
                include: {
                    created_by: true,
                    belong_to_folder: true,
                },
            });
            expect(result).toEqual(mockDocument);
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

            mockPrismaInstance.document.create.mockResolvedValue(mockDocument);

            const input = {
                name: 'test-document.pdf',
                file_size: '100 KB',
                document_user_id: 1,
                folder_document_id: 5,
            };

            const result = await createDocument(input);

            expect(mockPrismaInstance.document.create).toHaveBeenCalledWith({
                data: {
                    name: 'test-document.pdf',
                    file_size: '100 KB',
                    file_type: 'document',
                    document_user_id: 1,
                    folder_document_id: 5,
                },
                include: {
                    created_by: true,
                    belong_to_folder: true,
                },
            });
            expect(result).toEqual(mockDocument);
        });

        it('should handle null folder_document_id', async () => {
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

            mockPrismaInstance.document.create.mockResolvedValue(mockDocument);

            const input = {
                name: 'test-document.pdf',
                file_size: '100 KB',
                document_user_id: 1,
                folder_document_id: null,
            };

            const result = await createDocument(input);

            expect(mockPrismaInstance.document.create).toHaveBeenCalledWith({
                data: {
                    name: 'test-document.pdf',
                    file_size: '100 KB',
                    file_type: 'document',
                    document_user_id: 1,
                    folder_document_id: null,
                },
                include: {
                    created_by: true,
                    belong_to_folder: true,
                },
            });
            expect(result).toEqual(mockDocument);
        });
    });

    describe('deleteDocument', () => {
        it('should delete a document by ID', async () => {
            const mockDeletedDocument = {
                id: 1,
                name: 'test-document.pdf',
                file_size: '100 KB',
                file_type: 'document',
                document_user_id: 1,
                folder_document_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockPrismaInstance.document.delete.mockResolvedValue(mockDeletedDocument);

            const result = await deleteDocument(1);

            expect(mockPrismaInstance.document.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(result).toEqual(mockDeletedDocument);
        });
    });

    describe('deleteManyDocuments', () => {
        it('should delete multiple documents by IDs', async () => {
            mockPrismaInstance.document.deleteMany.mockResolvedValue({ count: 3 });

            const result = await deleteManyDocuments([1, 2, 3]);

            expect(mockPrismaInstance.document.deleteMany).toHaveBeenCalledWith({
                where: { id: { in: [1, 2, 3] } },
            });
            expect(result).toEqual({ count: 3 });
        });

        it('should return count of 0 when no documents are deleted', async () => {
            mockPrismaInstance.document.deleteMany.mockResolvedValue({ count: 0 });

            const result = await deleteManyDocuments([999]);

            expect(mockPrismaInstance.document.deleteMany).toHaveBeenCalledWith({
                where: { id: { in: [999] } },
            });
            expect(result).toEqual({ count: 0 });
        });
    });

    describe('checkDocumentNamesExist', () => {
        it('should return array of existing document names for a user', async () => {
            const mockDocuments = [
                { name: 'existing-file.pdf' },
                { name: 'another-file.docx' },
            ];

            mockPrismaInstance.document.findMany.mockResolvedValue(mockDocuments);

            const result = await checkDocumentNamesExist(1, [
                'existing-file.pdf',
                'another-file.docx',
                'new-file.pdf',
            ]);

            expect(mockPrismaInstance.document.findMany).toHaveBeenCalledWith({
                where: {
                    document_user_id: 1,
                    name: { in: ['existing-file.pdf', 'another-file.docx', 'new-file.pdf'] },
                },
                select: {
                    name: true,
                },
            });
            expect(result).toEqual(['existing-file.pdf', 'another-file.docx']);
        });

        it('should return empty array when no duplicate names exist', async () => {
            mockPrismaInstance.document.findMany.mockResolvedValue([]);

            const result = await checkDocumentNamesExist(1, ['new-file.pdf', 'another-file.docx']);

            expect(result).toEqual([]);
        });
    });

    describe('getDocumentsWithoutFolders', () => {
        it('should return documents where folder_document_id is null', async () => {
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
                {
                    id: 2,
                    name: 'document2.pdf',
                    file_size: '200 KB',
                    document_user_id: 1,
                    folder_document_id: null,
                    created_by: { id: 1, name: 'Test User' },
                    belong_to_folder: null,
                },
            ];

            mockPrismaInstance.document.findMany.mockResolvedValue(mockDocuments);

            const result = await getDocumentsWithoutFolders(1);

            expect(mockPrismaInstance.document.findMany).toHaveBeenCalledWith({
                where: {
                    document_user_id: 1,
                    folder_document_id: null,
                },
                orderBy: { created_at: 'desc' },
                include: {
                    created_by: true,
                    belong_to_folder: true,
                },
            });
            expect(result).toEqual(mockDocuments);
        });
    });

    describe('updateDocumentsToFolder', () => {
        it('should update documents to assign them to a folder', async () => {
            mockPrismaInstance.document.updateMany.mockResolvedValue({ count: 3 });

            const result = await updateDocumentsToFolder([1, 2, 3], 5);

            expect(mockPrismaInstance.document.updateMany).toHaveBeenCalledWith({
                where: { id: { in: [1, 2, 3] } },
                data: {
                    folder_document_id: 5,
                },
            });
            expect(result).toEqual({ count: 3 });
        });

        it('should update documents to remove folder assignment (set to null)', async () => {
            mockPrismaInstance.document.updateMany.mockResolvedValue({ count: 2 });

            const result = await updateDocumentsToFolder([1, 2], null);

            expect(mockPrismaInstance.document.updateMany).toHaveBeenCalledWith({
                where: { id: { in: [1, 2] } },
                data: {
                    folder_document_id: null,
                },
            });
            expect(result).toEqual({ count: 2 });
        });

        it('should handle empty array of document IDs', async () => {
            mockPrismaInstance.document.updateMany.mockResolvedValue({ count: 0 });

            const result = await updateDocumentsToFolder([], 5);

            expect(mockPrismaInstance.document.updateMany).toHaveBeenCalledWith({
                where: { id: { in: [] } },
                data: {
                    folder_document_id: 5,
                },
            });
            expect(result).toEqual({ count: 0 });
        });
    });
});

