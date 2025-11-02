import { Request, Response } from 'express';
import * as usersModel from '@models/users/users.model';
import type { PaginationParams, SearchParams } from '@models/users/users.model';

/**
 * Get all users with pagination
 * GET /users?page=1&limit=10
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const skip = req.query.skip ? Number(req.query.skip) : undefined;
        const take = req.query.take ? Number(req.query.take) : undefined;

        const params: PaginationParams = {
            page,
            limit,
            skip,
            take,
        };

        const result = await usersModel.getAllUsers(params);

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            ...result,
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'getAllUsers: Error';
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users',
            error: errorMessage,
        });
    }
};

/**
 * Get documents and folders for a user with pagination
 * GET /users/:userId/documents-folders?page=1&limit=10
 */
export const getUserDocumentsAndFolders = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = Number(req.params.userId);

        if (isNaN(userId)) {
            res.status(500).json({
                success: false,
                message: 'Invalid user ID',
            });
            return;
        }

        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const skip = req.query.skip ? Number(req.query.skip) : undefined;
        const take = req.query.take ? Number(req.query.take) : undefined;

        const params: PaginationParams = {
            page,
            limit,
            skip,
            take,
        };

        const result = await usersModel.getUserDocumentsAndFolders(userId, params);

        res.status(200).json({
            success: true,
            message: 'Documents and folders retrieved successfully',
            ...result,
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'getUserDocumentsAndFolders: Error';
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve documents and folders',
            error: errorMessage,
        });
    }
};

/**
 * Search documents and folders with pagination
 * GET /users/:userId/search?search=query&page=1&limit=10
 */
export const searchUserDocumentsAndFolders = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = Number(req.params.userId);
        const searchQuery = req.query.search ? String(req.query.search) : '';

        if (isNaN(userId)) {
            res.status(500).json({
                success: false,
                message: 'Invalid user ID',
            });
            return;
        }

        if (!searchQuery.trim()) {
            res.status(500).json({
                success: false,
                message: 'Search query is required',
            });
            return;
        }

        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const skip = req.query.skip ? Number(req.query.skip) : undefined;
        const take = req.query.take ? Number(req.query.take) : undefined;

        const params: SearchParams = {
            page,
            limit,
            skip,
            take,
            search: searchQuery,
        };

        const result = await usersModel.searchUserDocumentsAndFolders(userId, params);

        res.status(200).json({
            success: true,
            message: 'Search results retrieved successfully',
            ...result,
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'searchUserDocumentsAndFolders: Error';
        res.status(500).json({
            success: false,
            message: 'Failed to search documents and folders',
            error: errorMessage,
        });
    }
};

