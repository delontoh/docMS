import { PrismaClient, Folder } from '@prisma/client';

const prisma = new PrismaClient();

export type CreateFolderInput = {
    name: string;
    folders_user_id: number;
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
