import { Router } from 'express';
import * as documentsController from '@controllers/documents/documents.controller';

const router = Router();

/**
 * @route   POST /api/documents
 * @desc    Create a new document
 */
router.post('/', documentsController.createDocument);


/**
 * @route   POST /api/documents/user/:userId/check-names
 * @desc    Check duplicate document names for a user
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
 * @route   DELETE /api/documents/:id
 * @desc    Delete a document by ID
 */
router.delete('/:id', documentsController.deleteDocument);

/**
 * @route   DELETE /api/documents
 * @desc    Delete multiple documents by IDs
 * @body    { ids: [1, 2, 3] }
 */
router.delete('/', documentsController.deleteManyDocuments);

export default router;
