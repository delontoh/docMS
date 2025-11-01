import { Request, Response } from 'express';
import * as usersModel from '@models/users/users.model';
import type { PaginationParams } from '@models/users/users.model';

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
 * Get a single user by ID
 * GET /users/:id
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID',
            });
            return;
        }

        const user = await usersModel.getUserById(id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'User retrieved successfully',
            data: user,
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'getUserById: Error';
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user',
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
            res.status(400).json({
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

