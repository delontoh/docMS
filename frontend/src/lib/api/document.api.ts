import { request } from './client';
import type { Document, CreateDocumentInput, PaginatedResponse } from '@/types';

/**
 * Get all documents with pagination
 */
export const getDocuments = async (
    params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<Document>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    const query = queryParams.toString();
    return request<PaginatedResponse<Document>>(`/documents${query ? `?${query}` : ''}`);
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
 * Update a document by ID
 */
export const updateDocument = async (
    id: number,
    data: Partial<CreateDocumentInput>
): Promise<{ success: boolean; data: Document }> => {
    return request<{ success: boolean; data: Document }>(`/documents/${id}`, {
        method: 'PUT',
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

