/**
 * Combines documents and folders, then sorts them
 * Folders appear first, then sorted by created_at date (newest first)
 * @param documents - Array of documents
 * @param folders - Array of folders
 * @returns Combined and sorted array
 */
export const combineAndSortFiles = <TDocument extends { created_at: Date | string | null; file_type: string }, TFolder extends { created_at: Date | string | null; file_type: string }>(
    documents: TDocument[],
    folders: TFolder[]
): (TDocument | TFolder)[] => {
    const combined: (TDocument | TFolder)[] = [...documents, ...folders].sort((a, b) => {
        const aIsFolder = a.file_type === 'folder';
        const bIsFolder = b.file_type === 'folder';

        if (aIsFolder !== bIsFolder) {
            return aIsFolder ? -1 : 1;
        }

        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
    });

    return combined;
};

