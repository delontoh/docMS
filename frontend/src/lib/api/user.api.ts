import { request } from './client';
import type { User, PaginatedResponse, Document, Folder } from '@/types';

/**
 * Get all users with pagination
 */
export const getUsers = async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    
    return request<PaginatedResponse<User>>(`/users${query ? `?${query}` : ''}`);
};

/**
 * Get a single user by ID
 */
export const getUserById = async (id: number): Promise<{ success: boolean; data: User }> => {
    return request<{ success: boolean; data: User }>(`/users/${id}`);
};

/**
 * Get documents and folders for a user with pagination (listing view)
 */
export const getUserDocumentsAndFolders = async (
    userId: number,
    params?: { page?: number; limit?: number }
): Promise<{
    success: boolean;
    documents: Document[];
    folders: Folder[];
    documentsTotal: number;
    foldersTotal: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    
    return request<{
        success: boolean;
        documents: Document[];
        folders: Folder[];
        documentsTotal: number;
        foldersTotal: number;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/users/${userId}/documents-folders${query ? `?${query}` : ''}`);
};

/**
 * Search documents and folders for a user with pagination
 */
export const searchUserDocumentsAndFolders = async (
    userId: number,
    params: { search: string; page?: number; limit?: number }
): Promise<{
    success: boolean;
    documents: Document[];
    folders: Folder[];
    documentsTotal: number;
    foldersTotal: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}> => {
    const queryParams = new URLSearchParams();

    queryParams.set('search', params.search);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    
    return request<{
        success: boolean;
        documents: Document[];
        folders: Folder[];
        documentsTotal: number;
        foldersTotal: number;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/users/${userId}/search?${query}`);
};

