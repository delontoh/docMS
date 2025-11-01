import { PrismaClient, User } from '@prisma/client';
import { formatFileSize } from '@utils/format.utils';

const prisma = new PrismaClient();

export type PaginationParams = {
    page?: number;
    limit?: number;
    skip?: number;
    take?: number;
};

export type PaginatedResult<T> = {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type CreateUserInput = {
    email: string;
    name: string;
};

export type UpdateUserInput = {
    email?: string;
    name?: string;
};

export type UserDocumentsAndFoldersResult = {
    documents: any[];
    folders: any[];
    documentsTotal: number;
    foldersTotal: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

/**
 * Create a new user
 */
export const createUser = async (data: CreateUserInput): Promise<User> => {
    return prisma.user.create({
        data: {
            email: data.email,
            name: data.name,
        },
        include: {
            documents: true,
            folders: true,
        },
    });
};

/**
 * Get all users with pagination
 */
export const getAllUsers = async (params?: PaginationParams): Promise<PaginatedResult<User>> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = params?.skip ?? (page - 1) * limit;
    const take = params?.take ?? limit;

    const [data, total] = await Promise.all([
        prisma.user.findMany({
            skip,
            take,
            orderBy: { created_at: 'desc' },
            include: {
                documents: true,
                folders: true,
            },
        }),
        prisma.user.count(),
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Get a user by ID
 */
export const getUserById = async (id: number): Promise<User | null> => {
    return prisma.user.findUnique({
        where: { id },
        include: {
            documents: true,
            folders: true,
        },
    });
};

/**
 * Get a user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
    return prisma.user.findUnique({
        where: { email },
        include: {
            documents: true,
            folders: true,
        },
    });
};

/**
 * Get documents and folders for a user with pagination
 */
export const getUserDocumentsAndFolders = async (userId: number, params?: PaginationParams): Promise<UserDocumentsAndFoldersResult> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = params?.skip ?? (page - 1) * limit;
    const take = params?.take ?? limit;

    const [documents, folders, documentsTotal, foldersTotal] = await Promise.all([
        prisma.document.findMany({
            where: { document_user_id: userId },
            skip,
            take,
            orderBy: { created_at: 'desc' },
            include: {
                created_by: true,
                belong_to_folder: true,
            },
        }),
        prisma.folder.findMany({
            where: { folders_user_id: userId },
            skip,
            take,
            orderBy: { created_at: 'desc' },
            include: {
                created_by: true,
                documents: true,
            },
        }),
        prisma.document.count({
            where: { document_user_id: userId },
        }),
        prisma.folder.count({
            where: { folders_user_id: userId },
        }),
    ]);

    // Format file_size for each document
    const formattedDocuments = documents.map((doc) => ({
        ...doc,
        file_size: formatFileSize(doc.file_size),
    }));

    const total = documentsTotal + foldersTotal;

    return {
        documents: formattedDocuments,
        folders,
        documentsTotal,
        foldersTotal,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Update a user by ID
 */
export const updateUser = async (id: number, data: UpdateUserInput): Promise<User> => {
    return prisma.user.update({
        where: { id },
        data: {
            email: data.email,
            name: data.name,
        },
        include: {
            documents: true,
            folders: true,
        },
    });
};

/**
 * Delete a user by ID
 */
export const deleteUser = async (id: number): Promise<User> => {
    return prisma.user.delete({
        where: { id },
    });
};

/**
 * Delete multiple users by IDs
 */
export const deleteManyUsers = async (ids: number[]): Promise<{ count: number }> => {
    return prisma.user.deleteMany({
        where: { id: { in: ids } },
    });
};
