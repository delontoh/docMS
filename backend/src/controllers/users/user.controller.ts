import { Request, Response } from 'express';
import * as usersModel from '@models/users/users.model';
import type { CreateUserInput, UpdateUserInput, PaginationParams } from '@models/users/users.model';

/**
 * Create a new user
 * POST /users
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, name } = req.body;

        if (!email || !name) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: { email, name }',
            });
            return;
        }

        const data: CreateUserInput = {
            email,
            name,
        };

        const user = await usersModel.createUser(data);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user,
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'createUser: Error';
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: errorMessage,
        });
    }
};

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
 * Update a user by ID
 * PUT /users/:id
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID',
            });
            return;
        }

        const { email, name } = req.body;

        const data: UpdateUserInput = {
            email,
            name,
        };

        const user = await usersModel.updateUser(id, data);

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user,
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'updateUser: Error';
        
        if (errorMessage.includes('Record to update does not exist')) {
            res.status(500).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: errorMessage,
        });
    }
};

/**
 * Delete a user by ID
 * DELETE /users/:id
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID',
            });
            return;
        }

        await usersModel.deleteUser(id);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'deleteUser: Error';
        
        if (errorMessage.includes('Record to delete does not exist')) {
            res.status(500).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: errorMessage,
        });
    }
};

/**
 * Delete multiple users by IDs
 * DELETE /users
 * Body: { ids: [1, 2, 3] }
 */
export const deleteManyUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Invalid IDs array provided',
            });
            return;
        }

        const numericIds = ids.map((id: unknown) => Number(id)).filter((id: number) => !isNaN(id));

        if (numericIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'No valid IDs provided',
            });
            return;
        }

        const result = await usersModel.deleteManyUsers(numericIds);

        res.status(200).json({
            success: true,
            message: `${result.count} user(s) deleted successfully`,
            data: { deletedCount: result.count },
        });
        
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'deleteManyUsers: Error';
        res.status(500).json({
            success: false,
            message: 'Failed to delete users',
            error: errorMessage,
        });
    }
};

