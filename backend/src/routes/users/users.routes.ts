import { Router } from 'express';
import * as usersController from '@controllers/users/user.controller';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 */
router.get('/', usersController.getAllUsers);

/**
 * @route   GET /api/users/:userId/documents-folders
 * @desc    Get documents and folders for a user with pagination (listing view)
 * @query   page, limit, skip, take
 */
router.get('/:userId/documents-folders', usersController.getUserDocumentsAndFolders);

/**
 * @route   GET /api/users/:userId/search
 * @desc    Search documents and folders for a user with pagination
 * @query   search, page, limit, skip, take
 */
router.get('/:userId/search', usersController.searchUserDocumentsAndFolders);

export default router;

