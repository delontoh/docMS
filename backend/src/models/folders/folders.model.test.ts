import {
    createFolder,
    getFolderById,
    deleteFolder,
    deleteManyFolders,
    checkFolderNamesExist,
} from './folders.model';
import { PrismaClient } from '@prisma/client';
import { mockPrisma } from '../../__mocks__/@prisma/client';

//Mock Prisma
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrismaInstance = new PrismaClient() as any as typeof mockPrisma;

describe('Folders Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createFolder', () => {
        it('should create a folder with required fields', async () => {
            const mockFolder = {
                id: 1,
                name: 'Test Folder',
                file_type: 'folder',
                folders_user_id: 1,
                created_at: new Date(),
                updated_at: new Date(),
                created_by: { id: 1, name: 'Test User', email: 'test@example.com' },
                documents: [],
            };

            mockPrismaInstance.folder.create.mockResolvedValue(mockFolder);

            const input = {
                name: 'Test Folder',
                folders_user_id: 1,
            };

            const result = await createFolder(input);

            expect(mockPrismaInstance.folder.create).toHaveBeenCalledWith({
                data: {
                    name: 'Test Folder',
                    file_type: 'folder',
                    folders_user_id: 1,
                },
                include: {
                    created_by: true,
                    documents: true,
                },
            });
            expect(result).toEqual(mockFolder);
        });
    });

    describe('getFolderById', () => {
        it('should return a folder by ID with related data', async () => {
            const mockFolder = {
                id: 1,
                name: 'Test Folder',
                file_type: 'folder',
                folders_user_id: 1,
                created_at: new Date(),
                updated_at: new Date(),
                created_by: { id: 1, name: 'Test User', email: 'test@example.com' },
                documents: [
                    { id: 1, name: 'doc1.pdf', created_at: new Date() },
                    { id: 2, name: 'doc2.pdf', created_at: new Date() },
                ],
            };

            mockPrismaInstance.folder.findUnique.mockResolvedValue(mockFolder);

            const result = await getFolderById(1);

            expect(mockPrismaInstance.folder.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: {
                    created_by: true,
                    documents: {
                        orderBy: { created_at: 'desc' },
                    },
                },
            });
            expect(result).toEqual(mockFolder);
        });

        it('should return null when folder does not exist', async () => {
            mockPrismaInstance.folder.findUnique.mockResolvedValue(null);

            const result = await getFolderById(999);

            expect(mockPrismaInstance.folder.findUnique).toHaveBeenCalledWith({
                where: { id: 999 },
                include: {
                    created_by: true,
                    documents: {
                        orderBy: { created_at: 'desc' },
                    },
                },
            });
            expect(result).toBeNull();
        });
    });

    describe('deleteFolder', () => {
        it('should disassociate documents from folder before deletion', async () => {
            const mockDeletedFolder = {
                id: 1,
                name: 'Test Folder',
                file_type: 'folder',
                folders_user_id: 1,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockPrismaInstance.document.updateMany.mockResolvedValue({ count: 3 });
            mockPrismaInstance.folder.delete.mockResolvedValue(mockDeletedFolder);

            const result = await deleteFolder(1);

            expect(mockPrismaInstance.document.updateMany).toHaveBeenCalledWith({
                where: { folder_document_id: 1 },
                data: { folder_document_id: null },
            });
            expect(mockPrismaInstance.folder.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(result).toEqual(mockDeletedFolder);
        });

        it('should delete folder even when no documents are associated', async () => {
            const mockDeletedFolder = {
                id: 2,
                name: 'Empty Folder',
                file_type: 'folder',
                folders_user_id: 1,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockPrismaInstance.document.updateMany.mockResolvedValue({ count: 0 });
            mockPrismaInstance.folder.delete.mockResolvedValue(mockDeletedFolder);

            const result = await deleteFolder(2);

            expect(mockPrismaInstance.document.updateMany).toHaveBeenCalled();
            expect(mockPrismaInstance.folder.delete).toHaveBeenCalledWith({
                where: { id: 2 },
            });
            expect(result).toEqual(mockDeletedFolder);
        });
    });

    describe('deleteManyFolders', () => {
        it('should disassociate documents from all folders before bulk deletion', async () => {
            mockPrismaInstance.document.updateMany.mockResolvedValue({ count: 5 });
            mockPrismaInstance.folder.deleteMany.mockResolvedValue({ count: 2 });

            const result = await deleteManyFolders([1, 2]);

            expect(mockPrismaInstance.document.updateMany).toHaveBeenCalledWith({
                where: { folder_document_id: { in: [1, 2] } },
                data: { folder_document_id: null },
            });
            expect(mockPrismaInstance.folder.deleteMany).toHaveBeenCalledWith({
                where: { id: { in: [1, 2] } },
            });
            expect(result).toEqual({ count: 2 });
        });

        it('should handle empty array of folder IDs', async () => {
            mockPrismaInstance.document.updateMany.mockResolvedValue({ count: 0 });
            mockPrismaInstance.folder.deleteMany.mockResolvedValue({ count: 0 });

            const result = await deleteManyFolders([]);

            expect(mockPrismaInstance.document.updateMany).toHaveBeenCalledWith({
                where: { folder_document_id: { in: [] } },
                data: { folder_document_id: null },
            });
            expect(mockPrismaInstance.folder.deleteMany).toHaveBeenCalledWith({
                where: { id: { in: [] } },
            });
            expect(result).toEqual({ count: 0 });
        });
    });

    describe('checkFolderNamesExist', () => {
        it('should return array of existing folder names for a user', async () => {
            const mockFolders = [
                { name: 'Existing Folder' },
                { name: 'Another Folder' },
            ];

            mockPrismaInstance.folder.findMany.mockResolvedValue(mockFolders);

            const result = await checkFolderNamesExist(1, [
                'Existing Folder',
                'Another Folder',
                'New Folder',
            ]);

            expect(mockPrismaInstance.folder.findMany).toHaveBeenCalledWith({
                where: {
                    folders_user_id: 1,
                    name: { in: ['Existing Folder', 'Another Folder', 'New Folder'] },
                },
                select: {
                    name: true,
                },
            });
            expect(result).toEqual(['Existing Folder', 'Another Folder']);
        });

        it('should return empty array when no duplicate names exist', async () => {
            mockPrismaInstance.folder.findMany.mockResolvedValue([]);

            const result = await checkFolderNamesExist(1, ['New Folder', 'Another New Folder']);

            expect(result).toEqual([]);
        });
    });
});

