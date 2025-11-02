import { PrismaClient, Folder } from '@prisma/client';

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

export type CreateFolderInput = {
    name: string;
    folders_user_id: number;
};

export type UpdateFolderInput = {
    name?: string;
};

/**
 * Create a new folder
 */
export const createFolder = async (data: CreateFolderInput): Promise<Folder> => {
    return prisma.folder.create({
        data: {
            name: data.name,
            file_type: 'folder',
            folders_user_id: data.folders_user_id,
        },
        include: {
            created_by: true,
            documents: true,
        },
    });
};

/**
 * Get all folders with pagination
 */
export const getAllFolders = async (params?: PaginationParams): Promise<PaginatedResult<Folder>> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = params?.skip ?? (page - 1) * limit;
    const take = params?.take ?? limit;

    const [data, total] = await Promise.all([
        prisma.folder.findMany({
            skip,
            take,
            orderBy: { created_at: 'desc' },
            include: {
                created_by: true,
                documents: true,
            },
        }),
        prisma.folder.count(),
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
 * Get folders by user ID with pagination
 */
export const getFoldersByUserId = async (userId: number, params?: PaginationParams): Promise<PaginatedResult<Folder>> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = params?.skip ?? (page - 1) * limit;
    const take = params?.take ?? limit;

    const [data, total] = await Promise.all([
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
        prisma.folder.count({
            where: { folders_user_id: userId },
        }),
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
 * Get a folder by ID
 */
export const getFolderById = async (id: number): Promise<Folder | null> => {
    return prisma.folder.findUnique({
        where: { id },
        include: {
            created_by: true,
            documents: {
                orderBy: { created_at: 'desc' },
            },
        },
    });
};

/**
 * Update a folder by ID
 */
export const updateFolder = async (id: number, data: UpdateFolderInput): Promise<Folder> => {
    return prisma.folder.update({
        where: { id },
        data: {
            name: data.name,
        },
        include: {
            created_by: true,
            documents: true,
        },
    });
};

/**
 * Delete a folder by ID
 * Sets all documents' folder_document_id to null before deleting the folder
 */
export const deleteFolder = async (id: number): Promise<Folder> => {
    //Update all documents in this folder to remove folder association
    await prisma.document.updateMany({
        where: { folder_document_id: id },
        data: { folder_document_id: null },
    });

    //Delete folder
    return prisma.folder.delete({
        where: { id },
    });
};

/**
 * Delete multiple folders by IDs
 * Sets all documents' folder_document_id to null for each folder before deleting
 */
export const deleteManyFolders = async (ids: number[]): Promise<{ count: number }> => {
    await prisma.document.updateMany({
        where: { folder_document_id: { in: ids } },
        data: { folder_document_id: null },
    });

    return prisma.folder.deleteMany({
        where: { id: { in: ids } },
    });
};

/**
 * Check duplicate folder names for a user
 * Returns an array of names that already exist
 */
export const checkFolderNamesExist = async (userId: number, names: string[]): Promise<string[]> => {
    const existingFolders = await prisma.folder.findMany({
        where: {
            folders_user_id: userId,
            name: { in: names },
        },
        select: {
            name: true,
        },
    });

    return existingFolders.map((folder) => folder.name);
};
