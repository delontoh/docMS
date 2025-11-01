import { PrismaClient, Document } from '@prisma/client';

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

    const [data, total] = await Promise.all([
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

    const [data, total] = await Promise.all([
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
 * Update a document by ID
 */
export const updateDocument = async (id: number, data: UpdateDocumentInput): Promise<Document> => {
    return prisma.document.update({
        where: { id },
        data: {
            name: data.name,
            file_size: data.file_size,
            folder_document_id: data.folder_document_id,
        },
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
