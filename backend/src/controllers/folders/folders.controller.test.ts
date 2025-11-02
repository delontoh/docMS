import { Request, Response } from 'express';
import {
    createFolder,
    getFolderById,
    deleteFolder,
    deleteManyFolders,
    checkFolderNamesExist,
} from './folders.controller';
import * as foldersModel from '@models/folders/folders.model';

//Mock folders model
jest.mock('@models/folders/folders.model');

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

describe('Folders Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createFolder', () => {
        it('should create a folder successfully', async () => {
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

            (foldersModel.createFolder as jest.Mock).mockResolvedValue(mockFolder);

            const req = createMockRequest({
                body: {
                    name: 'Test Folder',
                    folders_user_id: 1,
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createFolder(req, res);

            expect(foldersModel.createFolder).toHaveBeenCalledWith({
                name: 'Test Folder',
                folders_user_id: 1,
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Folder created successfully',
                data: mockFolder,
            });
        });

        it('should return error when required fields are missing', async () => {
            //Missing folders_user_id
            const req = createMockRequest({
                body: {
                    name: 'Test Folder',
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createFolder(req, res);

            expect(foldersModel.createFolder).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Missing required fields: { name, folders_user_id }',
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            (foldersModel.createFolder as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                body: {
                    name: 'Test Folder',
                    folders_user_id: 1,
                },
            }) as Request;
            const res = createMockResponse() as Response;

            await createFolder(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to create folder',
                error: 'Database error',
            });
        });
    });

    describe('getFolderById', () => {
        it('should get a folder by ID successfully', async () => {
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
                ],
            };

            (foldersModel.getFolderById as jest.Mock).mockResolvedValue(mockFolder);

            const req = createMockRequest({
                params: { id: '1' },
            }) as Request;
            const res = createMockResponse() as Response;

            await getFolderById(req, res);

            expect(foldersModel.getFolderById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Folder retrieved successfully',
                data: mockFolder,
            });
        });

        it('should return error when folder ID is invalid', async () => {
            const req = createMockRequest({
                params: { id: 'invalid' },
            }) as Request;
            const res = createMockResponse() as Response;

            await getFolderById(req, res);

            expect(foldersModel.getFolderById).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid folder ID',
            });
        });

        it('should return error when folder not found', async () => {
            (foldersModel.getFolderById as jest.Mock).mockResolvedValue(null);

            const req = createMockRequest({
                params: { id: '999' },
            }) as Request;
            const res = createMockResponse() as Response;

            await getFolderById(req, res);

            expect(foldersModel.getFolderById).toHaveBeenCalledWith(999);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Folder not found',
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            (foldersModel.getFolderById as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                params: { id: '1' },
            }) as Request;
            const res = createMockResponse() as Response;

            await getFolderById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to retrieve folder',
                error: 'Database error',
            });
        });
    });

    describe('deleteFolder', () => {
        it('should delete a folder successfully', async () => {
            (foldersModel.deleteFolder as jest.Mock).mockResolvedValue(undefined);

            const req = createMockRequest({
                params: { id: '1' },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteFolder(req, res);

            expect(foldersModel.deleteFolder).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Folder deleted successfully',
            });
        });

        it('should return error when folder ID is invalid', async () => {
            const req = createMockRequest({
                params: { id: 'invalid' },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteFolder(req, res);

            expect(foldersModel.deleteFolder).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid folder ID',
            });
        });

        it('should handle folder not found error', async () => {
            const error = new Error('Record to delete does not exist');
            (foldersModel.deleteFolder as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                params: { id: '999' },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteFolder(req, res);

            expect(foldersModel.deleteFolder).toHaveBeenCalledWith(999);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Folder not found',
            });
        });

        it('should handle generic errors', async () => {
            const error = new Error('Database error');
            (foldersModel.deleteFolder as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                params: { id: '1' },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteFolder(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to delete folder',
                error: 'Database error',
            });
        });
    });

    describe('deleteManyFolders', () => {
        it('should delete multiple folders successfully', async () => {
            (foldersModel.deleteManyFolders as jest.Mock).mockResolvedValue({ count: 2 });

            const req = createMockRequest({
                body: { ids: [1, 2] },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteManyFolders(req, res);

            expect(foldersModel.deleteManyFolders).toHaveBeenCalledWith([1, 2]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: '2 folder(s) deleted successfully',
                data: { deletedCount: 2 },
            });
        });

        it('should convert string IDs to numbers', async () => {
            (foldersModel.deleteManyFolders as jest.Mock).mockResolvedValue({ count: 2 });

            const req = createMockRequest({
                body: { ids: ['1', '2'] },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteManyFolders(req, res);

            expect(foldersModel.deleteManyFolders).toHaveBeenCalledWith([1, 2]);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should filter out invalid IDs', async () => {
            (foldersModel.deleteManyFolders as jest.Mock).mockResolvedValue({ count: 1 });

            const req = createMockRequest({
                body: { ids: [1, 'invalid', 2, NaN] },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteManyFolders(req, res);

            expect(foldersModel.deleteManyFolders).toHaveBeenCalledWith([1, 2]);
        });

        it('should return error when ids is not an array', async () => {
            const req = createMockRequest({
                body: { ids: 'not-an-array' },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteManyFolders(req, res);

            expect(foldersModel.deleteManyFolders).not.toHaveBeenCalled();
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

            await deleteManyFolders(req, res);

            expect(foldersModel.deleteManyFolders).not.toHaveBeenCalled();
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

            await deleteManyFolders(req, res);

            expect(foldersModel.deleteManyFolders).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No valid IDs provided',
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            (foldersModel.deleteManyFolders as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                body: { ids: [1, 2] },
            }) as Request;
            const res = createMockResponse() as Response;

            await deleteManyFolders(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to delete folders',
                error: 'Database error',
            });
        });
    });

    describe('checkFolderNamesExist', () => {
        it('should check folder names successfully', async () => {
            (foldersModel.checkFolderNamesExist as jest.Mock).mockResolvedValue([
                'Existing Folder',
            ]);

            const req = createMockRequest({
                params: { userId: '1' },
                body: { names: ['Existing Folder', 'New Folder'] },
            }) as Request;
            const res = createMockResponse() as Response;

            await checkFolderNamesExist(req, res);

            expect(foldersModel.checkFolderNamesExist).toHaveBeenCalledWith(1, [
                'Existing Folder',
                'New Folder',
            ]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Folder names checked successfully',
                data: {
                    existingNames: ['Existing Folder'],
                    totalChecked: 2,
                    duplicatesFound: 1,
                },
            });
        });

        it('should return error when user ID is invalid', async () => {
            const req = createMockRequest({
                params: { userId: 'invalid' },
                body: { names: ['Folder'] },
            }) as Request;
            const res = createMockResponse() as Response;

            await checkFolderNamesExist(req, res);

            expect(foldersModel.checkFolderNamesExist).not.toHaveBeenCalled();
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

            await checkFolderNamesExist(req, res);

            expect(foldersModel.checkFolderNamesExist).not.toHaveBeenCalled();
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

            await checkFolderNamesExist(req, res);

            expect(foldersModel.checkFolderNamesExist).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid names array provided',
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            (foldersModel.checkFolderNamesExist as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                params: { userId: '1' },
                body: { names: ['Folder'] },
            }) as Request;
            const res = createMockResponse() as Response;

            await checkFolderNamesExist(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to check folder names',
                error: 'Database error',
            });
        });
    });
});

