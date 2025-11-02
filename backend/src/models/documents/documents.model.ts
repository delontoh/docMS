import { PrismaClient, Document } from '@prisma/client';
import { formatFileSize } from '@utils/format.utils';

const prisma = new PrismaClient();

export type CreateDocumentInput = {
    name: string;
    file_size: string;
    document_user_id: number;
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
            file_type: 'document',
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

/**
 * Get documents without folders for a user
 * Returns documents where folder_document_id is null
 */
export const getDocumentsWithoutFolders = async (userId: number): Promise<Document[]> => {
    return prisma.document.findMany({
        where: {
            document_user_id: userId,
            folder_document_id: null,
        },
        orderBy: { created_at: 'desc' },
        include: {
            created_by: true,
            belong_to_folder: true,
        },
    });
};

/**
 * Update and assign documents to a folder
 */
export const updateDocumentsToFolder = async (documentIds: number[], folderId: number | null): Promise<{ count: number }> => {
    return prisma.document.updateMany({
        where: { id: { in: documentIds } },
        data: {
            folder_document_id: folderId,
        },
    });
};
