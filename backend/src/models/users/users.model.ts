import { PrismaClient, User } from '@prisma/client';
import { formatFileSize } from '@utils/format.utils';
import { combineAndSortFiles } from '@utils/combineAndSortFiles.utils';

const prisma = new PrismaClient();

export type PaginationParams = {
    page?: number;
    limit?: number;
    skip?: number;
    take?: number;
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

export type PaginatedResult<T> = {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
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
 * Get documents and folders for a user with pagination
 */
export const getUserDocumentsAndFolders = async (userId: number, params?: PaginationParams): Promise<UserDocumentsAndFoldersResult> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = params?.skip ?? (page - 1) * limit;
    const take = params?.take ?? limit;

    const [documentsTotal, foldersTotal] = await Promise.all([
        prisma.document.count({
            where: { document_user_id: userId },
        }),
        prisma.folder.count({
            where: { folders_user_id: userId },
        }),
    ]);

    const total = documentsTotal + foldersTotal;
    const calculatedTotalPages = total > 0 ? Math.ceil(total / limit) : 1;
    const itemsNeeded = page * limit;

    const [allDocuments, allFolders] = await Promise.all([
        prisma.document.findMany({
            where: { document_user_id: userId },
            take: Math.min(itemsNeeded, documentsTotal),
            orderBy: { created_at: 'desc' },
            include: {
                created_by: true,
                belong_to_folder: true,
            },
        }),

        prisma.folder.findMany({
            where: { folders_user_id: userId },
            take: Math.min(itemsNeeded, foldersTotal),
            orderBy: { created_at: 'desc' },
            include: {
                created_by: true,
                documents: true,
            },
        }),
    ]);

    //Format file size for each document
    const formattedAllDocuments = allDocuments.map((doc) => ({
        ...doc,
        file_size: formatFileSize(doc.file_size),
        file_type: (doc as any).file_type || 'document',
    }));

    const foldersWithType = allFolders.map((folder) => ({
        ...folder,
        file_type: (folder as any).file_type || 'folder',
    }));

    const combined = combineAndSortFiles(formattedAllDocuments, foldersWithType);

    //Apply pagination to combined array
    const paginatedItems = combined.slice(skip, skip + take);
    //Return documents and folders separately
    const documents = paginatedItems.filter((item) => item.file_type === 'document') as any[];
    const folders = paginatedItems.filter((item) => item.file_type === 'folder') as any[];

    return {
        documents,
        folders,
        documentsTotal,
        foldersTotal,
        total,
        page,
        limit,
        totalPages: calculatedTotalPages,
    };
};