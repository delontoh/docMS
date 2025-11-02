'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { setItems } from '@/lib/store/slices/documentsSlice';
import {
    Box,
    Card,
    Typography,
    TextField,
    InputAdornment,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    IconButton,
    Menu,
    MenuItem,
    Pagination,
    Select,
    FormControl,
    Paper,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Search as SearchIcon,
    Upload as UploadIcon,
    Add as AddIcon,
    FolderOutlined as FolderIcon,
    DescriptionOutlined as DescriptionIcon,
    MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';
import {
    deleteDocument,
    deleteFolder,
    deleteManyDocuments,
    deleteManyFolders,
    getUsers,
} from '@/lib/api';
import type { DocumentItem, FolderItem } from '@/types';
import UploadModal from '@/components/features/documents/UploadModal';
import CreateFolderModal from '@/components/features/folders/CreateFolderModal';
import ViewFolderModal from '@/components/features/folders/ViewFolderModal';
import DeleteFolderModal from '@/components/features/folders/DeleteFolderModal';
import { formatDate } from '@/lib/utils/date.utils';
import { useDocumentsAndFolders } from '@/hooks/useDocumentsAndFolders';

export default function DocumentListing() {
    const dispatch = useAppDispatch();
    const itemsById = useAppSelector((state) => state.documents.itemsById);
    
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [anchorEl, setAnchorEl] = useState<{ element: HTMLElement; itemId: number } | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
    const [viewFolderModalOpen, setViewFolderModalOpen] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [deleteFolderModalOpen, setDeleteFolderModalOpen] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState<{ id: number; name: string } | null>(null);
    const [foldersToDeleteBulk, setFoldersToDeleteBulk] = useState<{ ids: number[]; names: string[] } | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { items, loading, error: fetchError, totalPages, fetchData } = useDocumentsAndFolders({
        userId,
        page,
        rowsPerPage,
        searchQuery,
    });

    //Update store when items change
    useEffect(() => {
        if (items.length > 0) {
            dispatch(setItems(items));
        }
    }, [items, dispatch]);

    //Fetch user ID from database (only one user exists in seeded data)
    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const users = await getUsers();
                if (users?.length > 0) {
                    setUserId(users[0]?.id ?? null);
                }
            } catch (err) {
                console.error('Failed to fetch user:', err);
            }
        };

        fetchUserId();
    }, []);

    useEffect(() => {
        if (fetchError) {
            setError(fetchError);
        }
    }, [fetchError]);

    //Reset to page 1 if no data in other pages
    useEffect(() => {
        if (items.length === 0 && page > 1 && !loading) {
            setPage(1);
        }
    }, [items.length, page, loading]);
    
    //Search input debounced
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput.trim());
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput]);

    //Reset page to 1 when search query changes
    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const displayItems = useMemo(() => {
        return items;
    }, [items]);

    const calculatedTotalPages = useMemo(() => {
        return totalPages;
    }, [totalPages]);

    //Ensure valid page range when calculatedTotalPages changes
    useEffect(() => {
        if (calculatedTotalPages > 0 && page > calculatedTotalPages) {
            setPage(1);
        }
    }, [calculatedTotalPages, page]);

    const getItemKey = (item: DocumentItem | FolderItem): string => {
        return `${item.type}-${item.id}`;
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedItems(new Set(displayItems.map((item) => getItemKey(item))));
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleSelectItem = (item: DocumentItem | FolderItem) => {
        const itemKey = getItemKey(item);
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemKey)) {
            newSelected.delete(itemKey);
        } else {
            newSelected.add(itemKey);
        }
        setSelectedItems(newSelected);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, itemId: number) => {
        setAnchorEl({ element: event.currentTarget, itemId });
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDelete = async (itemId: number, type: 'document' | 'folder') => {
        try {
            if (type === 'document') {
                await deleteDocument(itemId);
            } else {
                //Handle folder delete to show popup confirmation
                const folder = items.find((item) => item.id === itemId && item.type === 'folder');
                if (folder) {
                    setFolderToDelete({ id: itemId, name: folder.name });
                    setFoldersToDeleteBulk(null);
                    setDeleteFolderModalOpen(true);
                    handleMenuClose();
                    return;
                }
            }

            await fetchData();
            //Remove from selected items
            setSelectedItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(`${type}-${itemId}`);
                return newSet;
            });
            handleMenuClose();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete item');
        }
    };

    const handleConfirmDeleteFolder = async () => {
        if (!folderToDelete) return;

        try {
            await deleteFolder(folderToDelete.id);

            await fetchData();
            setSelectedItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(`folder-${folderToDelete.id}`);
                return newSet;
            });

            setDeleteFolderModalOpen(false);
            setFolderToDelete(null);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete folder');
        }
    };

    const handleViewFolder = (folderId: number) => {
        setSelectedFolderId(folderId);
        setViewFolderModalOpen(true);
        handleMenuClose();
    };

    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) return;

        //Separate selected items
        const documentIds: number[] = [];
        const folderIds: number[] = [];
        const folderNames: string[] = [];

        //Loop through selectedItems keys
        selectedItems.forEach((itemKey) => {
            const [type, idStr] = itemKey.split('-');
            const id = Number(idStr);
            
            if (type === 'document') {
                documentIds.push(id);
            } else if (type === 'folder') {
                folderIds.push(id);
                const folder = itemsById[itemKey] as FolderItem | undefined;
                folderNames.push(folder?.name || `Folder ${id}`);
            }
        });

        //Show confirmation popup for multiple folders
        if (folderIds.length > 0) {
            setFoldersToDeleteBulk({ ids: folderIds, names: folderNames });
            setFolderToDelete(null);
            setDeleteFolderModalOpen(true);
            return;
        }

        //If only documents, proceed with deletion
        await executeBulkDelete(documentIds, []);
    };

    const executeBulkDelete = async (documentIds: number[], folderIds: number[]) => {
        try {
            const deletePromises: Promise<unknown>[] = [];
            if (documentIds.length > 0) {
                deletePromises.push(deleteManyDocuments(documentIds));
            }
            if (folderIds.length > 0) {
                deletePromises.push(deleteManyFolders(folderIds));
            }
            await Promise.all(deletePromises);
            
            await fetchData();
            setSelectedItems(new Set());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete items');
        }
    };

    //Handles bulk folder deletion after user confirmation
    const handleConfirmBulkDeleteFolders = async () => {
        if (!foldersToDeleteBulk) return;

        //Get remaining document IDs that are selected - check all selectedItems keys
        const documentIds: number[] = [];
        selectedItems.forEach((itemKey) => {
            const [type, idStr] = itemKey.split('-');
            const id = Number(idStr);
            
            if (type === 'document') {
                documentIds.push(id);
            }
        });

        await executeBulkDelete(documentIds, foldersToDeleteBulk.ids);
        setDeleteFolderModalOpen(false);
        setFoldersToDeleteBulk(null);
    };

    const isAllSelected = displayItems.length > 0 && displayItems.every((item) => selectedItems.has(getItemKey(item)));
    const isIndeterminate = selectedItems.size > 0 && selectedItems.size < displayItems.length;

    return (
        <Card sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    Documents
                </Typography>

                {/* Files and folders buttons */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => setUploadModalOpen(true)}
                        sx={{
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            '&:hover': {
                                borderColor: 'primary.dark',
                                backgroundColor: (theme) => `${theme.palette.primary.main}0A`,
                            },
                        }}
                    >
                        Upload files
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateFolderModalOpen(true)}
                        sx={{
                            backgroundColor: 'primary.main',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            },
                        }}
                    >
                        Add new folder
                    </Button>
                </Box>
            </Box>

            {/* Search Bar and Bulk Delete */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    
                    <TextField
                        placeholder="Search"
                        size="small"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{ width: 250 }}
                    />

                    {selectedItems.size > 0 && (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleBulkDelete}
                            disabled={loading}
                        >
                            Delete Selected ({selectedItems.size})
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Handle error */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Table listing view */}
            <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'primary.main' }}>
                            <TableCell padding="checkbox" sx={{ color: 'white' }}>
                                <Checkbox
                                    indeterminate={isIndeterminate}
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                    sx={{
                                        color: 'white',
                                        '&.Mui-checked': { color: 'white' },
                                        '&.MuiCheckbox-indeterminate': { color: 'white' },
                                    }}
                                />
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Created by</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>File size</TableCell>
                            <TableCell sx={{ color: 'white', width: 60 }}></TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : displayItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">
                                        {searchQuery ? 'No items match your search' : 'No documents or folders'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayItems.map((item) => (
                                <TableRow
                                    key={`${item.type}-${item.id}`}
                                    hover
                                    sx={{
                                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedItems.has(getItemKey(item))}
                                            onChange={() => handleSelectItem(item)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {item.type === 'folder' ? (
                                                <FolderIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                                            ) : (
                                                <DescriptionIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                                            )}
                                            <Typography variant="body2">{item?.name || '-'}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {item.type === 'document'
                                                ? (item as DocumentItem).created_by?.name || 'Unknown'
                                                : (item as FolderItem).created_by?.name || 'Unknown'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {item.created_at ? formatDate(item.created_at) : '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {item.type === 'document' ? (item as DocumentItem).file_size : '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, item.id)}
                                            sx={{ color: '#666' }}
                                        >
                                            <MoreHorizIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">Show</Typography>
                    <FormControl size="small" sx={{ minWidth: 70 }}>
                        <Select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={25}>25</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                            <MenuItem value={100}>100</MenuItem>
                        </Select>
                    </FormControl>
                    <Typography variant="body2">rows per page</Typography>
                </Box>

                {calculatedTotalPages > 0 && displayItems.length > 0 && (
                    <Pagination
                        count={calculatedTotalPages}
                        page={Math.min(page, calculatedTotalPages)}
                        onChange={(_, newPage) => {
                            if (newPage <= calculatedTotalPages && newPage >= 1 && newPage > 0) {
                                setPage(newPage);
                            }
                        }}
                        color="primary"
                        showFirstButton
                        showLastButton
                        disabled={displayItems.length === 0}
                    />
                )}
            </Box>

            <Menu
                anchorEl={anchorEl?.element}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {anchorEl && (() => {
                    const item = items.find((i) => i.id === anchorEl?.itemId);
                    if (!item) return null;

                    {/* Menu item for folder file type */}
                    if (item.type === 'folder') {
                        return (
                            <>
                                <MenuItem
                                    onClick={() => {
                                        if (anchorEl) {
                                            handleViewFolder(anchorEl.itemId);
                                        }
                                    }}
                                    sx={{
                                        backgroundColor: 'primary.main',
                                        color: 'primary.contrastText',
                                        '&:hover': {
                                            backgroundColor: 'primary.dark',
                                        },
                                    }}
                                >
                                    View
                                </MenuItem>

                                <MenuItem
                                    onClick={() => {
                                        if (anchorEl) {
                                            handleDelete(anchorEl.itemId, item.type);
                                        }
                                    }}
                                    sx={{
                                        backgroundColor: 'error.main',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: 'error.dark',
                                        },
                                    }}
                                >
                                    Delete
                                </MenuItem>
                            </>
                        );
                        
                    {/* Menu item for document file type */}
                    } else {
                        return (
                            <MenuItem
                                onClick={() => {
                                    if (anchorEl) {
                                        handleDelete(anchorEl.itemId, item.type);
                                    }
                                }}
                                sx={{
                                    backgroundColor: 'error.main',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'error.dark',
                                    },
                                }}
                            >
                                Delete
                            </MenuItem>
                        );
                    }
                })()}
            </Menu>

            {/* Upload Document Modal */}
            {userId !== null && (
                <UploadModal
                    open={uploadModalOpen}
                    onClose={() => setUploadModalOpen(false)}
                    userId={userId}
                    onUploadSuccess={() => {
                        fetchData();
                    }}
                />
            )}

            {/* Create Folder Modal */}
            {userId !== null && (
                <CreateFolderModal
                    open={createFolderModalOpen}
                    onClose={() => setCreateFolderModalOpen(false)}
                    userId={userId}
                    onFolderCreated={() => {
                        fetchData();
                    }}
                />
            )}

            {/* View Folder Modal */}
            {selectedFolderId !== null && (
                <ViewFolderModal
                    open={viewFolderModalOpen}
                    onClose={() => {
                        setViewFolderModalOpen(false);
                        setSelectedFolderId(null);
                    }}
                    folderId={selectedFolderId}
                />
            )}

            {/* Delete folder popup confirmation */}
            <DeleteFolderModal
                open={deleteFolderModalOpen}
                onClose={() => {
                    setDeleteFolderModalOpen(false);
                    setFolderToDelete(null);
                    setFoldersToDeleteBulk(null);
                }}
                onConfirm={() => {
                    if (folderToDelete) {
                        handleConfirmDeleteFolder();
                    } else if (foldersToDeleteBulk) {
                        handleConfirmBulkDeleteFolders();
                    }
                }}
                folderName={folderToDelete?.name}
                folderCount={foldersToDeleteBulk?.ids.length}
                folderNames={foldersToDeleteBulk?.names}
            />
        </Card>
    );
}

