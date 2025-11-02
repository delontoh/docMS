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

        if (!name || !file_size || !document_user_id) {
            res.status(500).json({
                success: false,
                message: 'Missing required fields: { name, file_size, document_user_id }',
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

    } catch (error) {
        let errorMessage = error instanceof Error ? error.message : 'createDocument: Error';
        let statusCode = 500;

        //Handle duplicate document names for same user (Prisma error messages)
        if (errorMessage.includes('Unique constraint') || errorMessage.includes('P2002')) {
            errorMessage = `A document with the name "${name}" already exists for this user.`;
            statusCode = 500;
        }

        res.status(statusCode).json({
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
        const errorMessage = error instanceof Error ? error.message : 'getAllDocuments: Error';
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

        const result = await documentsModel.getDocumentsByUserId(userId, params);

        res.status(200).json({
            success: true,
            message: 'Documents retrieved successfully',
            ...result,
        });
        
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'getDocumentsByUserId: Error';
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
            res.status(500).json({
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
        const errorMessage = error instanceof Error ? error.message : 'getDocumentsByFolderId: Error';
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
            res.status(500).json({
                success: false,
                message: 'Invalid document ID',
            });
            return;
        }

        const document = await documentsModel.getDocumentById(id);

        if (!document) {
            res.status(500).json({
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
        const errorMessage = error instanceof Error ? error.message : 'getDocumentById: Error';
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve document',
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
            res.status(500).json({
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
        const errorMessage = error instanceof Error ? error.message : 'deleteDocument: Error';
        
        if (errorMessage.includes('Record to delete does not exist')) {
            res.status(500).json({
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
            res.status(500).json({
                success: false,
                message: 'Invalid IDs array provided',
            });
            return;
        }

        const numericIds = ids.map((id: unknown) => Number(id)).filter((id: number) => !isNaN(id));

        if (numericIds.length === 0) {
            res.status(500).json({
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
        const errorMessage = error instanceof Error ? error.message : 'deleteManyDocuments: Error';
        res.status(500).json({
            success: false,
            message: 'Failed to delete documents',
            error: errorMessage,
        });
    }
};

/**
 * Check which document names already exist for a user
 * POST /documents/user/:userId/check-names
 * Body: { names: ["file1.pdf", "file2.docx"] }
 */
export const checkDocumentNamesExist = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = Number(req.params.userId);
        const { names } = req.body;

        if (isNaN(userId)) {
            res.status(500).json({
                success: false,
                message: 'Invalid user ID',
            });
            return;
        }

        if (!Array.isArray(names) || names.length === 0) {
            res.status(500).json({
                success: false,
                message: 'Invalid names array provided',
            });
            return;
        }

        const existingNames = await documentsModel.checkDocumentNamesExist(userId, names);

        res.status(200).json({
            success: true,
            message: 'Document names checked successfully',
            data: {
                existingNames,
                totalChecked: names.length,
                duplicatesFound: existingNames.length,
            },
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'checkDocumentNamesExist: Error';
        res.status(500).json({
            success: false,
            message: 'Failed to check document names',
            error: errorMessage,
        });
    }
};

/**
 * Get documents without folders for a user
 * GET /documents/user/:userId/without-folder
 */
export const getDocumentsWithoutFolders = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = Number(req.params.userId);

        if (isNaN(userId)) {
            res.status(500).json({
                success: false,
                message: 'Invalid user ID',
            });
            return;
        }

        const documents = await documentsModel.getDocumentsWithoutFolders(userId);

        res.status(200).json({
            success: true,
            message: 'Documents retrieved successfully',
            data: documents,
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'getDocumentsWithoutFolders: Error';
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve documents',
            error: errorMessage,
        });
    }
};

/**
 * Update documents and assign them to a folder
 * PUT /documents/assign-folder
 * Body: { documentIds: [1, 2, 3], folderId: 5 }
 */
export const assignDocumentsToFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { documentIds, folderId } = req.body;

        if (!Array.isArray(documentIds) || documentIds.length === 0) {
            res.status(500).json({
                success: false,
                message: 'Invalid documentIds array provided',
            });
            return;
        }

        const numericIds = documentIds.map((id: unknown) => Number(id)).filter((id: number) => !isNaN(id));
        if (numericIds.length === 0) {
            res.status(500).json({
                success: false,
                message: 'No valid document IDs provided',
            });
            return;
        }

        const numericFolderId = folderId !== null && folderId !== undefined ? Number(folderId) : null;
        if (numericFolderId !== null && isNaN(numericFolderId)) {
            res.status(500).json({
                success: false,
                message: 'Invalid folder ID',
            });
            return;
        }

        const result = await documentsModel.updateDocumentsToFolder(numericIds, numericFolderId);

        res.status(200).json({
            success: true,
            message: `${result.count} document(s) assigned to folder successfully`,
            data: { updatedCount: result.count },
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'assignDocumentsToFolder: Error';
        res.status(500).json({
            success: false,
            message: 'Failed to assign documents to folder',
            error: errorMessage,
        });
    }
};
