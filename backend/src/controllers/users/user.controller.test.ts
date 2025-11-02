import { Request, Response } from 'express';
import {
    getAllUsers,
    getUserDocumentsAndFolders,
    searchUserDocumentsAndFolders,
} from './user.controller';
import * as usersModel from '@models/users/users.model';

//Mock users model
jest.mock('@models/users/users.model');

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

describe('Users Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllUsers', () => {
        it('should get all users successfully', async () => {
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

            (usersModel.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

            const req = createMockRequest({}) as Request;
            const res = createMockResponse() as Response;

            await getAllUsers(req, res);

            expect(usersModel.getAllUsers).toHaveBeenCalledWith();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Users retrieved successfully',
                data: mockUsers,
            });
        });

        it('should return empty array when no users exist', async () => {
            (usersModel.getAllUsers as jest.Mock).mockResolvedValue([]);

            const req = createMockRequest({}) as Request;
            const res = createMockResponse() as Response;

            await getAllUsers(req, res);

            expect(usersModel.getAllUsers).toHaveBeenCalledWith();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Users retrieved successfully',
                data: [],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            (usersModel.getAllUsers as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({}) as Request;
            const res = createMockResponse() as Response;

            await getAllUsers(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to retrieve users',
                error: 'Database error',
            });
        });
    });

    describe('getUserDocumentsAndFolders', () => {
        it('should get user documents and folders successfully', async () => {
            const mockResult = {
                data: [
                    {
                        id: 1,
                        name: 'Folder 1',
                        file_type: 'folder',
                        folders_user_id: 1,
                        created_at: new Date(),
                    },
                    {
                        id: 1,
                        name: 'document1.pdf',
                        file_type: 'document',
                        document_user_id: 1,
                        created_at: new Date(),
                    },
                ],
                documentsTotal: 5,
                foldersTotal: 3,
                total: 8,
                page: 1,
                limit: 10,
                totalPages: 1,
            };

            (usersModel.getUserDocumentsAndFolders as jest.Mock).mockResolvedValue(mockResult);

            const req = createMockRequest({
                params: { userId: '1' },
            }) as Request;
            const res = createMockResponse() as Response;

            await getUserDocumentsAndFolders(req, res);

            expect(usersModel.getUserDocumentsAndFolders).toHaveBeenCalledWith(1, {
                page: undefined,
                limit: undefined,
                skip: undefined,
                take: undefined,
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Documents and folders retrieved successfully',
                ...mockResult,
            });
        });

        it('should get user documents and folders with pagination', async () => {
            const mockResult = {
                data: [],
                documentsTotal: 15,
                foldersTotal: 5,
                total: 20,
                page: 2,
                limit: 10,
                totalPages: 2,
            };

            (usersModel.getUserDocumentsAndFolders as jest.Mock).mockResolvedValue(mockResult);

            const req = createMockRequest({
                params: { userId: '1' },
                query: { page: '2', limit: '10' },
            }) as Request;
            const res = createMockResponse() as Response;

            await getUserDocumentsAndFolders(req, res);

            expect(usersModel.getUserDocumentsAndFolders).toHaveBeenCalledWith(1, {
                page: 2,
                limit: 10,
                skip: undefined,
                take: undefined,
            });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return error when user ID is invalid', async () => {
            const req = createMockRequest({
                params: { userId: 'invalid' },
            }) as Request;
            const res = createMockResponse() as Response;

            await getUserDocumentsAndFolders(req, res);

            expect(usersModel.getUserDocumentsAndFolders).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid user ID',
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            (usersModel.getUserDocumentsAndFolders as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                params: { userId: '1' },
            }) as Request;
            const res = createMockResponse() as Response;

            await getUserDocumentsAndFolders(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to retrieve documents and folders',
                error: 'Database error',
            });
        });
    });

    describe('searchUserDocumentsAndFolders', () => {
        it('should search user documents and folders successfully', async () => {
            const mockResult = {
                data: [
                    {
                        id: 1,
                        name: 'test-document.pdf',
                        file_type: 'document',
                        document_user_id: 1,
                        created_at: new Date(),
                    },
                    {
                        id: 1,
                        name: 'Test Folder',
                        file_type: 'folder',
                        folders_user_id: 1,
                        created_at: new Date(),
                    },
                ],
                documentsTotal: 2,
                foldersTotal: 1,
                total: 3,
                page: 1,
                limit: 10,
                totalPages: 1,
            };

            (usersModel.searchUserDocumentsAndFolders as jest.Mock).mockResolvedValue(mockResult);

            const req = createMockRequest({
                params: { userId: '1' },
                query: { search: 'test' },
            }) as Request;
            const res = createMockResponse() as Response;

            await searchUserDocumentsAndFolders(req, res);

            expect(usersModel.searchUserDocumentsAndFolders).toHaveBeenCalledWith(1, {
                page: undefined,
                limit: undefined,
                skip: undefined,
                take: undefined,
                search: 'test',
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Search results retrieved successfully',
                ...mockResult,
            });
        });

        it('should search with pagination', async () => {
            const mockResult = {
                data: [],
                documentsTotal: 10,
                foldersTotal: 5,
                total: 15,
                page: 2,
                limit: 10,
                totalPages: 2,
            };

            (usersModel.searchUserDocumentsAndFolders as jest.Mock).mockResolvedValue(mockResult);

            const req = createMockRequest({
                params: { userId: '1' },
                query: { search: 'query', page: '2', limit: '10' },
            }) as Request;
            const res = createMockResponse() as Response;

            await searchUserDocumentsAndFolders(req, res);

            expect(usersModel.searchUserDocumentsAndFolders).toHaveBeenCalledWith(1, {
                page: 2,
                limit: 10,
                skip: undefined,
                take: undefined,
                search: 'query',
            });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return error when user ID is invalid', async () => {
            const req = createMockRequest({
                params: { userId: 'invalid' },
                query: { search: 'test' },
            }) as Request;
            const res = createMockResponse() as Response;

            await searchUserDocumentsAndFolders(req, res);

            expect(usersModel.searchUserDocumentsAndFolders).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid user ID',
            });
        });

        it('should return error when search query is missing', async () => {
            const req = createMockRequest({
                params: { userId: '1' },
                query: {},
            }) as Request;
            const res = createMockResponse() as Response;

            await searchUserDocumentsAndFolders(req, res);

            expect(usersModel.searchUserDocumentsAndFolders).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Search query is required',
            });
        });

        it('should return error when search query is empty string', async () => {
            const req = createMockRequest({
                params: { userId: '1' },
                query: { search: '' },
            }) as Request;
            const res = createMockResponse() as Response;

            await searchUserDocumentsAndFolders(req, res);

            expect(usersModel.searchUserDocumentsAndFolders).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Search query is required',
            });
        });

        it('should return error when search query is only whitespace', async () => {
            const req = createMockRequest({
                params: { userId: '1' },
                query: { search: '   ' },
            }) as Request;
            const res = createMockResponse() as Response;

            await searchUserDocumentsAndFolders(req, res);

            expect(usersModel.searchUserDocumentsAndFolders).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Search query is required',
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            (usersModel.searchUserDocumentsAndFolders as jest.Mock).mockRejectedValue(error);

            const req = createMockRequest({
                params: { userId: '1' },
                query: { search: 'test' },
            }) as Request;
            const res = createMockResponse() as Response;

            await searchUserDocumentsAndFolders(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to search documents and folders',
                error: 'Database error',
            });
        });
    });
});

