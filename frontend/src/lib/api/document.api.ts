import { request } from './client';
import type { Document, CreateDocumentInput, PaginatedResponse } from '@/types';

/**
 * Get documents by user ID with pagination
 */
export const getDocumentsByUserId = async (
    userId: number,
    params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<Document>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    
    return request<PaginatedResponse<Document>>(
        `/documents/user/${userId}${query ? `?${query}` : ''}`
    );
};

/**
 * Get a single document by ID
 */
export const getDocumentById = async (id: number): Promise<{ success: boolean; data: Document }> => {
    return request<{ success: boolean; data: Document }>(`/documents/${id}`);
};

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

