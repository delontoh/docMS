import type { Document } from './document.types';

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

export type CreateFolderInput = {
    name: string;
    folders_user_id: number;
};

export type FolderItem = Folder & { type: 'folder' };

