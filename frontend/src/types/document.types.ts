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

export type CreateDocumentInput = {
    name: string;
    file_size: string;
    document_user_id: number;
    folder_document_id?: number | null;
};

export type DocumentItem = Document & { type: 'document' };

