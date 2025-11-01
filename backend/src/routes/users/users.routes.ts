import { Router } from 'express';
import * as usersController from '@controllers/users/user.controller';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination
 * @access  Public
 * @query   page, limit, skip, take
 */
router.get('/', usersController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user by ID
 * @access  Public
 */
router.get('/:id', usersController.getUserById);

export default router;

