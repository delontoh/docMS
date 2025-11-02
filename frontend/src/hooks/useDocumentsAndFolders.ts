import { useState, useEffect, useCallback } from 'react';
import { getUserDocumentsAndFolders, searchUserDocumentsAndFolders } from '@/lib/api';
import type { DocumentItem, FolderItem, Item } from '@/types';

type UseDocumentsAndFoldersParams = {
    userId: number | null;
    page: number;
    rowsPerPage: number;
    searchQuery: string;
};

type UseDocumentsAndFoldersReturn = {
    items: Item[];
    loading: boolean;
    error: string | null;
    totalPages: number;
    fetchData: () => Promise<void>;
};

/**
 * Fetch documents and folders for a user with pagination
 * Use searchUserDocumentsAndFolders when searchQuery is provided, 
 * otherwise use getUserDocumentsAndFolders
 */
export const useDocumentsAndFolders = ({
    userId,
    page,
    rowsPerPage,
    searchQuery,
}: UseDocumentsAndFoldersParams): UseDocumentsAndFoldersReturn => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);

    const fetchData = useCallback(async () => {
        if (!userId) {
            setItems([]);
            setTotalPages(1);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = searchQuery.trim()
                ? await searchUserDocumentsAndFolders(userId, {
                      search: searchQuery.trim(),
                      page,
                      limit: rowsPerPage,
                  })
                : await getUserDocumentsAndFolders(userId, {
                      page,
                      limit: rowsPerPage,
                  });

            const documents: DocumentItem[] = (response?.documents || []).map((doc) => ({
                ...doc,
                type: 'document' as const,
            }));
            const folders: FolderItem[] = (response?.folders || []).map((folder) => ({
                ...folder,
                type: 'folder' as const,
            }));

            //Combine both folders and documents
            const combined = [...documents, ...folders].sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === 'folder' ? -1 : 1;
                }
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });

            setItems(combined);
            const responseTotalPages = response?.totalPages || 1;
            setTotalPages(responseTotalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load documents');
            setItems([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [userId, page, rowsPerPage, searchQuery]);

    useEffect(() => {
        if (userId !== null) {
            fetchData();
        }
    }, [fetchData, userId]);

    return {
        items,
        loading,
        error,
        totalPages,
        fetchData,
    };
};

