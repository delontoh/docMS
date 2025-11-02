import { Router } from 'express';
import * as documentsController from '@controllers/documents/documents.controller';

const router = Router();

/**
 * @route   POST /api/documents
 * @desc    Create a new document
 * @access  Public
 */
router.post('/', documentsController.createDocument);

/**
 * @route   GET /api/documents
 * @desc    Get all documents with pagination
 * @access  Public
 * @query   page, limit, skip, take
 */
router.get('/', documentsController.getAllDocuments);

/**
 * @route   GET /api/documents/user/:userId
 * @desc    Get documents by user ID with pagination
 * @access  Public
 * @query   page, limit, skip, take
 */
router.get('/user/:userId', documentsController.getDocumentsByUserId);

/**
 * @route   POST /api/documents/user/:userId/check-names
 * @desc    Check duplicate document names for a user
 * @access  Public
 * @body    { names: ["file1.pdf", "file2.docx"] }
 */
router.post('/user/:userId/check-names', documentsController.checkDocumentNamesExist);

/**
 * GET /api/documents/user/:userId/without-folder
 * Get documents without folders
 */
router.get('/user/:userId/without-folder', documentsController.getDocumentsWithoutFolders);

/**
 * PUT /api/documents/assign-folder
 * Assign documents to a folder
 */
router.put('/assign-folder', documentsController.assignDocumentsToFolder);

/**
 * @route   GET /api/documents/folder/:folderId
 * @desc    Get documents by folder ID with pagination
 * @access  Public
 * @query   page, limit, skip, take
 */
router.get('/folder/:folderId', documentsController.getDocumentsByFolderId);

/**
 * @route   GET /api/documents/:id
 * @desc    Get a single document by ID
 * @access  Public
 */
router.get('/:id', documentsController.getDocumentById);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete a document by ID
 * @access  Public
 */
router.delete('/:id', documentsController.deleteDocument);

/**
 * @route   DELETE /api/documents
 * @desc    Delete multiple documents by IDs
 * @access  Public
 * @body    { ids: [1, 2, 3] }
 */
router.delete('/', documentsController.deleteManyDocuments);

export default router;
