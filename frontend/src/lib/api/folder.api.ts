import { request } from './client';
import type { Folder, CreateFolderInput } from '@/types';

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

