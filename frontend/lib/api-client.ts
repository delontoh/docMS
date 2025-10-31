const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export type Document = {
    id: number;
    name: string;
    file_size: string;
    created_at: string;
    updated_at: string;
    document_user_id: number;
    folder_document_id: number | null;
    created_by?: {
        id: number;
        name: string;
        email: string;
    };
    belong_to_folder?: {
        id: number;
        name: string;
    } | null;
};

export type Folder = {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    folders_user_id: number;
    created_by?: {
        id: number;
        name: string;
        email: string;
    };
    documents?: Document[];
};

export type PaginatedResponse<T> = {
    success: boolean;
    message: string;
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

export type CreateFolderInput = {
    name: string;
    folders_user_id: number;
};

/**
 * Internal request helper function
 */
const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
};

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
 * Delete a document by ID
 */
export const deleteDocument = async (id: number): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/documents/${id}`, {
        method: 'DELETE',
    });
};

/**
 * Get all folders with pagination
 */
export const getFolders = async (
    params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<Folder>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    const query = queryParams.toString();
    return request<PaginatedResponse<Folder>>(`/folders${query ? `?${query}` : ''}`);
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
 * Delete a folder by ID
 */
export const deleteFolder = async (id: number): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/folders/${id}`, {
        method: 'DELETE',
    });
};

