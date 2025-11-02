import { request } from './client';
import type { Folder, CreateFolderInput, PaginatedResponse } from '@/types';

/**
 * Get folders by user ID with pagination
 */
export const getFoldersByUserId = async (
    userId: number,
    params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<Folder>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    
    const query = queryParams.toString();

    return request<PaginatedResponse<Folder>>(`/folders/user/${userId}${query ? `?${query}` : ''}`);
};

/**
 * Get a single folder by ID
 */
export const getFolderById = async (id: number): Promise<{ success: boolean; data: Folder }> => {
    return request<{ success: boolean; data: Folder }>(`/folders/${id}`);
};

/**
 * Create a new folder
 */
export const createFolder = async (data: CreateFolderInput): Promise<{ success: boolean; data: Folder }> => {
    return request<{ success: boolean; data: Folder }>('/folders', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * Update a folder by ID
 */
export const updateFolder = async (
    id: number,
    data: Partial<CreateFolderInput>
): Promise<{ success: boolean; data: Folder }> => {
    return request<{ success: boolean; data: Folder }>(`/folders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

/**
 * Delete a folder by ID
 */
export const deleteFolder = async (id: number): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/folders/${id}`, {
        method: 'DELETE',
    });
};

/**
 * Delete multiple folders by IDs
 */
export const deleteManyFolders = async (ids: number[]): Promise<{ success: boolean; message: string; data: { deletedCount: number } }> => {
    return request<{ success: boolean; message: string; data: { deletedCount: number } }>('/folders', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
};

/**
 * Check which folder names already exist for a user
 */
export const checkFolderNamesExist = async (
    userId: number,
    names: string[]
): Promise<{ success: boolean; data: { existingNames: string[]; totalChecked: number; duplicatesFound: number } }> => {
    return request<{ success: boolean; data: { existingNames: string[]; totalChecked: number; duplicatesFound: number } }>(
        `/folders/user/${userId}/check-names`,
        {
            method: 'POST',
            body: JSON.stringify({ names }),
        }
    );
};

