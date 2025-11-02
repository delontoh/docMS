import { request } from './client';
import type { Document, CreateDocumentInput } from '@/types';

/**
 * Create a new document
 */
export const createDocument = async (
    data: CreateDocumentInput
): Promise<{ success: boolean; data: Document }> => {
    return request<{ success: boolean; data: Document }>('/documents', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * Delete a document by ID
 */
export const deleteDocument = async (id: number): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/documents/${id}`, {
        method: 'DELETE',
    });
};

/**
 * Delete multiple documents by IDs
 */
export const deleteManyDocuments = async (ids: number[]): Promise<{ success: boolean; message: string; data: { deletedCount: number } }> => {
    return request<{ success: boolean; message: string; data: { deletedCount: number } }>('/documents', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
};

/**
 * Check which document names already exist for a user
 */
export const checkDocumentNamesExist = async (
    userId: number,
    names: string[]
): Promise<{ success: boolean; data: { existingNames: string[]; totalChecked: number; duplicatesFound: number } }> => {
    return request<{ success: boolean; data: { existingNames: string[]; totalChecked: number; duplicatesFound: number } }>(
        `/documents/user/${userId}/check-names`,
        {
            method: 'POST',
            body: JSON.stringify({ names }),
        }
    );
};

/**
 * Get documents without folders for a user
 */
export const getDocumentsWithoutFolders = async (userId: number): Promise<{ success: boolean; data: Document[] }> => {
    return request<{ success: boolean; data: Document[] }>(`/documents/user/${userId}/without-folder`);
};

/**
 * Assign documents to a folder
 */
export const assignDocumentsToFolder = async (
    documentIds: number[],
    folderId: number | null
): Promise<{ success: boolean; message: string; data: { updatedCount: number } }> => {
    return request<{ success: boolean; message: string; data: { updatedCount: number } }>('/documents/assign-folder', {
        method: 'PUT',
        body: JSON.stringify({ documentIds, folderId }),
    });
};

