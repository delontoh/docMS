import { PrismaClient, Document } from '@prisma/client';
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

export type CreateDocumentInput = {
    name: string;
    file_size: string;
    document_user_id: number;
    folder_document_id?: number | null;
};

export type UpdateDocumentInput = {
    name?: string;
    file_size?: string;
    folder_document_id?: number | null;
};

/**
 * Create new document
 */
export const createDocument = async (data: CreateDocumentInput): Promise<Document> => {
    return prisma.document.create({
        data: {
            name: data.name,
            file_size: data.file_size,
            document_user_id: data.document_user_id,
            folder_document_id: data.folder_document_id ?? null,
        },
        include: {
            created_by: true,
            belong_to_folder: true,
        },
    });
};

/**
 * Get all documents with pagination
 */
export const getAllDocuments = async (params?: PaginationParams): Promise<PaginatedResult<Document>> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = params?.skip ?? (page - 1) * limit;
    const take = params?.take ?? limit;

    const [rawData, total] = await Promise.all([
        prisma.document.findMany({
            skip,
            take,
            orderBy: { created_at: 'desc' },
            include: {
                created_by: true,
                belong_to_folder: true,
            },
        }),
        prisma.document.count(),
    ]);

    // Format file_size for each document
    const data = rawData.map((doc) => ({
        ...doc,
        file_size: formatFileSize(doc.file_size),
    }));

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Get documents by user ID with pagination
 */
export const getDocumentsByUserId = async (userId: number, params?: PaginationParams): Promise<PaginatedResult<Document>> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = params?.skip ?? (page - 1) * limit;
    const take = params?.take ?? limit;

    const [rawData, total] = await Promise.all([
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
        prisma.document.count({
            where: { document_user_id: userId },
        }),
    ]);

    //Format file_size for each document
    const data = rawData.map((doc) => ({
        ...doc,
        file_size: formatFileSize(doc.file_size),
    }));

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Get documents by folder ID with pagination
 */
export const getDocumentsByFolderId = async (folderId: number, params?: PaginationParams): Promise<PaginatedResult<Document>> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = params?.skip ?? (page - 1) * limit;
    const take = params?.take ?? limit;

    const [data, total] = await Promise.all([
        prisma.document.findMany({
            where: { folder_document_id: folderId },
            skip,
            take,
            orderBy: { created_at: 'desc' },
            include: {
                created_by: true,
                belong_to_folder: true,
            },
        }),
        prisma.document.count({
            where: { folder_document_id: folderId },
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
 * Get a document by ID
 */
export const getDocumentById = async (id: number): Promise<Document | null> => {
    return prisma.document.findUnique({
        where: { id },
        include: {
            created_by: true,
            belong_to_folder: true,
        },
    });
};

/**
 * Delete a document by ID
 */
export const deleteDocument = async (id: number): Promise<Document> => {
    return prisma.document.delete({
        where: { id },
    });
};

/**
 * Delete multiple documents by IDs
 */
export const deleteManyDocuments = async (ids: number[]): Promise<{ count: number }> => {
    return prisma.document.deleteMany({
        where: { id: { in: ids } },
    });
};

/**
 * Check duplicate document names for a user
 * Returns an array of names that already exist
 */
export const checkDocumentNamesExist = async (userId: number, names: string[]): Promise<string[]> => {
    const existingDocuments = await prisma.document.findMany({
        where: {
            document_user_id: userId,
            name: { in: names },
        },
        select: {
            name: true,
        },
    });

    return existingDocuments.map((doc) => doc.name);
};
