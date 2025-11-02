import {
    getAllUsers,
    getUserDocumentsAndFolders,
    searchUserDocumentsAndFolders,
} from './users.model';
import { formatFileSize } from '@utils/format.utils';
import { combineAndSortFiles } from '@utils/combineAndSortFiles.utils';
import { PrismaClient } from '@prisma/client';
import { mockPrisma } from '../../__mocks__/@prisma/client';

//Mock Prisma
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrismaInstance = new PrismaClient() as any as typeof mockPrisma;

//Mock utilities
jest.mock('@utils/format.utils', () => ({
    formatFileSize: jest.fn((size: string) => size),
}));

jest.mock('@utils/combineAndSortFiles.utils', () => ({
    combineAndSortFiles: jest.fn((docs, folders) => [...folders, ...docs]),
}));

describe('Users Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (formatFileSize as jest.Mock).mockImplementation((size: string) => size);
        (combineAndSortFiles as jest.Mock).mockImplementation((docs, folders) => [...folders, ...docs]);
    });

    describe('getAllUsers', () => {
        it('should return all users as an array', async () => {
            const mockUsers = [
                {
                    id: 1,
                    name: 'User 1',
                    email: 'user1@example.com',
                    created_at: new Date(),
                    documents: [],
                    folders: [],
                },
            ];

            mockPrismaInstance.user.findMany.mockResolvedValue(mockUsers);

            const result = await getAllUsers();

            expect(mockPrismaInstance.user.findMany).toHaveBeenCalledWith({
                orderBy: { created_at: 'desc' },
                include: {
                    documents: true,
                    folders: true,
                },
            });
            expect(result).toEqual(mockUsers);
        });

        it('should return empty array when no users exist', async () => {
            mockPrismaInstance.user.findMany.mockResolvedValue([]);

            const result = await getAllUsers();

            expect(mockPrismaInstance.user.findMany).toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });

    describe('getUserDocumentsAndFolders', () => {
        it('should return combined and paginated documents and folders', async () => {
            const mockDocuments = [
                {
                    id: 1,
                    name: 'document1.pdf',
                    file_size: '100 KB',
                    file_type: 'document',
                    document_user_id: 1,
                    folder_document_id: null,
                    created_at: new Date('2024-01-02'),
                    created_by: { id: 1, name: 'User 1' },
                    belong_to_folder: null,
                },
            ];

            const mockFolders = [
                {
                    id: 1,
                    name: 'Folder 1',
                    file_type: 'folder',
                    folders_user_id: 1,
                    created_at: new Date('2024-01-01'),
                    created_by: { id: 1, name: 'User 1' },
                    documents: [],
                },
            ];

            mockPrismaInstance.document.count.mockResolvedValue(1);
            mockPrismaInstance.folder.count.mockResolvedValue(1);
            mockPrismaInstance.document.findMany.mockResolvedValue(mockDocuments);
            mockPrismaInstance.folder.findMany.mockResolvedValue(mockFolders);

            const result = await getUserDocumentsAndFolders(1, { page: 1, limit: 10 });

            expect(mockPrismaInstance.document.count).toHaveBeenCalledWith({
                where: { document_user_id: 1 },
            });
            expect(mockPrismaInstance.folder.count).toHaveBeenCalledWith({
                where: { folders_user_id: 1 },
            });

            expect(formatFileSize).toHaveBeenCalled();
            expect(combineAndSortFiles).toHaveBeenCalled();

            expect(result).toMatchObject({
                documentsTotal: 1,
                foldersTotal: 1,
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
            });
        });

        it('should handle pagination correctly when fetching multiple pages', async () => {
            //Mock multiple documents
            const mockDocuments = Array.from({ length: 15 }, (_, i) => ({
                id: i + 1,
                name: `document${i + 1}.pdf`,
                file_size: '100 KB',
                file_type: 'document',
                document_user_id: 1,
                folder_document_id: null,
                created_at: new Date(),
                created_by: { id: 1, name: 'User 1' },
                belong_to_folder: null,
            }));

            mockPrismaInstance.document.count.mockResolvedValue(15);
            mockPrismaInstance.folder.count.mockResolvedValue(0);

            mockPrismaInstance.document.findMany.mockResolvedValue(mockDocuments);
            mockPrismaInstance.folder.findMany.mockResolvedValue([]);

            const result = await getUserDocumentsAndFolders(1, { page: 2, limit: 10 });

            expect(result.totalPages).toBe(2);
            expect(result.page).toBe(2);
        });
    });

    describe('searchUserDocumentsAndFolders', () => {
        it('should search and return filtered documents and folders', async () => {
            const mockDocuments = [
                {
                    id: 1,
                    name: 'test-document.pdf',
                    file_size: '100 KB',
                    file_type: 'document',
                    document_user_id: 1,
                    folder_document_id: null,
                    created_at: new Date(),
                    created_by: { id: 1, name: 'User 1' },
                    belong_to_folder: null,
                },
            ];

            const mockFolders = [
                {
                    id: 1,
                    name: 'Test Folder',
                    file_type: 'folder',
                    folders_user_id: 1,
                    created_at: new Date(),
                    created_by: { id: 1, name: 'User 1' },
                    documents: [],
                },
            ];

            mockPrismaInstance.document.count.mockResolvedValue(1);
            mockPrismaInstance.folder.count.mockResolvedValue(1);
            mockPrismaInstance.document.findMany.mockResolvedValue(mockDocuments);
            mockPrismaInstance.folder.findMany.mockResolvedValue(mockFolders);

            const result = await searchUserDocumentsAndFolders(1, {
                search: 'test',
                page: 1,
                limit: 10,
            });

            expect(mockPrismaInstance.document.findMany).toHaveBeenCalledWith({
                where: {
                    document_user_id: 1,
                    name: { contains: 'test' },
                },
                take: expect.any(Number),
                orderBy: { created_at: 'desc' },
                include: {
                    created_by: true,
                    belong_to_folder: true,
                },
            });
            expect(mockPrismaInstance.folder.findMany).toHaveBeenCalledWith({
                where: {
                    folders_user_id: 1,
                    name: { contains: 'test' },
                },
                take: expect.any(Number),
                orderBy: { created_at: 'desc' },
                include: {
                    created_by: true,
                    documents: true,
                },
            });
            expect(result).toMatchObject({
                documentsTotal: 1,
                foldersTotal: 1,
                total: 2,
            });
        });

        it('should fall back to getUserDocumentsAndFolders when search query is empty', async () => {
            mockPrismaInstance.document.count.mockResolvedValue(5);
            mockPrismaInstance.folder.count.mockResolvedValue(3);
            mockPrismaInstance.document.findMany.mockResolvedValue([]);
            mockPrismaInstance.folder.findMany.mockResolvedValue([]);

            await searchUserDocumentsAndFolders(1, {
                search: '',
                page: 1,
                limit: 10,
            });

            expect(mockPrismaInstance.document.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { document_user_id: 1 },
                })
            );
        });

        it('should handle case-insensitive search', async () => {
            mockPrismaInstance.document.count.mockResolvedValue(2);
            mockPrismaInstance.folder.count.mockResolvedValue(1);
            mockPrismaInstance.document.findMany.mockResolvedValue([]);
            mockPrismaInstance.folder.findMany.mockResolvedValue([]);

            await searchUserDocumentsAndFolders(1, {
                search: 'TEST',
                page: 1,
                limit: 10,
            });

            expect(mockPrismaInstance.document.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        document_user_id: 1,
                        name: { contains: 'TEST' },
                    },
                })
            );
        });
    });
});

