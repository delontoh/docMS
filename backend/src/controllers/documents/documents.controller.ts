import { Request, Response } from 'express';
import * as documentsModel from '@models/documents/documents.model';
import type { CreateDocumentInput, UpdateDocumentInput, PaginationParams } from '@models/documents/documents.model';

/**
 * Create a new document
 * POST /documents
 */
export const createDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, file_size, document_user_id, folder_document_id } = req.body;

        // Validation
        if (!name || !file_size || !document_user_id) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: name, file_size, and document_user_id are required',
            });
            return;
        }

        const data: CreateDocumentInput = {
            name,
            file_size,
            document_user_id: Number(document_user_id),
            folder_document_id: folder_document_id ? Number(folder_document_id) : null,
        };

        const document = await documentsModel.createDocument(data);

        res.status(201).json({
            success: true,
            message: 'Document created successfully',
            data: document,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Failed to create document',
            error: errorMessage,
        });
    }
};

/**
 * Get all documents with pagination
 * GET /documents?page=1&limit=10
 */
export const getAllDocuments = async (req: Request, res: Response): Promise<void> => {
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

        const result = await documentsModel.getAllDocuments(params);

        res.status(200).json({
            success: true,
            message: 'Documents retrieved successfully',
            ...result,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve documents',
            error: errorMessage,
        });
    }
};

/**
 * Get documents by user ID with pagination
 * GET /documents/user/:userId?page=1&limit=10
 */
export const getDocumentsByUserId = async (req: Request, res: Response): Promise<void> => {
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

        const result = await documentsModel.getDocumentsByUserId(userId, params);

        res.status(200).json({
            success: true,
            message: 'Documents retrieved successfully',
            ...result,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve documents',
            error: errorMessage,
        });
    }
};

/**
 * Get documents by folder ID with pagination
 * GET /documents/folder/:folderId?page=1&limit=10
 */
export const getDocumentsByFolderId = async (req: Request, res: Response): Promise<void> => {
    try {
        const folderId = Number(req.params.folderId);

        if (isNaN(folderId)) {
            res.status(400).json({
                success: false,
                message: 'Invalid folder ID',
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

        const result = await documentsModel.getDocumentsByFolderId(folderId, params);

        res.status(200).json({
            success: true,
            message: 'Documents retrieved successfully',
            ...result,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve documents',
            error: errorMessage,
        });
    }
};

/**
 * Get a single document by ID
 * GET /documents/:id
 */
export const getDocumentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid document ID',
            });
            return;
        }

        const document = await documentsModel.getDocumentById(id);

        if (!document) {
            res.status(404).json({
                success: false,
                message: 'Document not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Document retrieved successfully',
            data: document,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve document',
            error: errorMessage,
        });
    }
};

/**
 * Update a document by ID
 * PUT /documents/:id
 */
export const updateDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid document ID',
            });
            return;
        }

        const { name, file_size, folder_document_id } = req.body;

        const data: UpdateDocumentInput = {
            name,
            file_size,
            folder_document_id: folder_document_id !== undefined ? Number(folder_document_id) : null,
        };

        const document = await documentsModel.updateDocument(id, data);

        res.status(200).json({
            success: true,
            message: 'Document updated successfully',
            data: document,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Handle Prisma not found error
        if (errorMessage.includes('Record to update does not exist')) {
            res.status(404).json({
                success: false,
                message: 'Document not found',
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update document',
            error: errorMessage,
        });
    }
};

/**
 * Delete a document by ID
 * DELETE /documents/:id
 */
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid document ID',
            });
            return;
        }

        await documentsModel.deleteDocument(id);

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully',
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Handle Prisma not found error
        if (errorMessage.includes('Record to delete does not exist')) {
            res.status(404).json({
                success: false,
                message: 'Document not found',
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete document',
            error: errorMessage,
        });
    }
};

/**
 * Delete multiple documents by IDs
 * DELETE /documents
 * Body: { ids: [1, 2, 3] }
 */
export const deleteManyDocuments = async (req: Request, res: Response): Promise<void> => {
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

        const result = await documentsModel.deleteManyDocuments(numericIds);

        res.status(200).json({
            success: true,
            message: `${result.count} document(s) deleted successfully`,
            data: { deletedCount: result.count },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Failed to delete documents',
            error: errorMessage,
        });
    }
};
