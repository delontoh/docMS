import { Router } from 'express';
import * as foldersController from '@controllers/folders/folders.controller';

const router = Router();

/**
 * @route   POST /api/folders
 * @desc    Create a new folder
 * @access  Public
 */
router.post('/', foldersController.createFolder);

/**
 * @route   POST /api/folders/user/:userId/check-names
 * @desc    Check for duplicate folder names
 * @access  Public
 */
router.post('/user/:userId/check-names', foldersController.checkFolderNamesExist);

/**
 * @route   GET /api/folders/:id
 * @desc    Get a single folder by ID
 * @access  Public
 */
router.get('/:id', foldersController.getFolderById);

/**
 * @route   DELETE /api/folders/:id
 * @desc    Delete a folder by ID
 * @access  Public
 */
router.delete('/:id', foldersController.deleteFolder);

/**
 * @route   DELETE /api/folders
 * @desc    Delete multiple folders by IDs
 * @access  Public
 * @body    { ids: [1, 2, 3] }
 */
router.delete('/', foldersController.deleteManyFolders);

export default router;
