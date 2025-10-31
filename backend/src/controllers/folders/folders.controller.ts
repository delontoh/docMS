import { Request, Response } from 'express';
import * as foldersModel from '@models/folders/folders.model';
import type { CreateFolderInput, UpdateFolderInput, PaginationParams } from '@models/folders/folders.model';

/**
 * Create a new folder
 * POST /folders
 */
export const createFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, folders_user_id } = req.body;

        // Validation
        if (!name || !folders_user_id) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: name and folders_user_id are required',
            });
            return;
        }

        const data: CreateFolderInput = {
            name,
            folders_user_id: Number(folders_user_id),
        };

        const folder = await foldersModel.createFolder(data);

        res.status(201).json({
            success: true,
            message: 'Folder created successfully',
            data: folder,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Failed to create folder',
            error: errorMessage,
        });
    }
};

/**
 * Get all folders with pagination
 * GET /folders?page=1&limit=10
 */
export const getAllFolders = async (req: Request, res: Response): Promise<void> => {
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

        const result = await foldersModel.getAllFolders(params);

        res.status(200).json({
            success: true,
            message: 'Folders retrieved successfully',
            ...result,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve folders',
            error: errorMessage,
        });
    }
};

/**
 * Get folders by user ID with pagination
 * GET /folders/user/:userId?page=1&limit=10
 */
export const getFoldersByUserId = async (req: Request, res: Response): Promise<void> => {
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

        const result = await foldersModel.getFoldersByUserId(userId, params);

        res.status(200).json({
            success: true,
            message: 'Folders retrieved successfully',
            ...result,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve folders',
            error: errorMessage,
        });
    }
};

/**
 * Get a single folder by ID
 * GET /folders/:id
 */
export const getFolderById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid folder ID',
            });
            return;
        }

        const folder = await foldersModel.getFolderById(id);

        if (!folder) {
            res.status(404).json({
                success: false,
                message: 'Folder not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Folder retrieved successfully',
            data: folder,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve folder',
            error: errorMessage,
        });
    }
};

/**
 * Update a folder by ID
 * PUT /folders/:id
 */
export const updateFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid folder ID',
            });
            return;
        }

        const { name } = req.body;

        const data: UpdateFolderInput = {
            name,
        };

        const folder = await foldersModel.updateFolder(id, data);

        res.status(200).json({
            success: true,
            message: 'Folder updated successfully',
            data: folder,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Handle Prisma not found error
        if (errorMessage.includes('Record to update does not exist')) {
            res.status(404).json({
                success: false,
                message: 'Folder not found',
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update folder',
            error: errorMessage,
        });
    }
};

/**
 * Delete a folder by ID
 * DELETE /folders/:id
 */
export const deleteFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid folder ID',
            });
            return;
        }

        await foldersModel.deleteFolder(id);

        res.status(200).json({
            success: true,
            message: 'Folder deleted successfully',
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Handle Prisma not found error
        if (errorMessage.includes('Record to delete does not exist')) {
            res.status(404).json({
                success: false,
                message: 'Folder not found',
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete folder',
            error: errorMessage,
        });
    }
};

/**
 * Delete multiple folders by IDs
 * DELETE /folders
 * Body: { ids: [1, 2, 3] }
 */
export const deleteManyFolders = async (req: Request, res: Response): Promise<void> => {
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

        const result = await foldersModel.deleteManyFolders(numericIds);

        res.status(200).json({
            success: true,
            message: `${result.count} folder(s) deleted successfully`,
            data: { deletedCount: result.count },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Failed to delete folders',
            error: errorMessage,
        });
    }
};
