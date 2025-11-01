import { request } from './client';
import type { User, CreateUserInput, UpdateUserInput, PaginatedResponse } from '@/types';

/**
 * Get all users with pagination
 */
export const getUsers = async (
    params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<User>> => {
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
 * Create a new user
 */
export const createUser = async (data: CreateUserInput): Promise<{ success: boolean; data: User }> => {
    return request<{ success: boolean; data: User }>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * Update a user by ID
 */
export const updateUser = async (
    id: number,
    data: UpdateUserInput
): Promise<{ success: boolean; data: User }> => {
    return request<{ success: boolean; data: User }>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

/**
 * Delete a user by ID
 */
export const deleteUser = async (id: number): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/users/${id}`, {
        method: 'DELETE',
    });
};

/**
 * Get documents and folders for a user with pagination
 */
export const getUserDocumentsAndFolders = async (
    userId: number,
    params?: { page?: number; limit?: number }
): Promise<{
    success: boolean;
    documents: any[];
    folders: any[];
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
        documents: any[];
        folders: any[];
        documentsTotal: number;
        foldersTotal: number;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/users/${userId}/documents-folders${query ? `?${query}` : ''}`);
};

