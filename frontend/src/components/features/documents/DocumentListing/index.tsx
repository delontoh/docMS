'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
    getUserDocumentsAndFolders,
    deleteDocument,
    deleteFolder,
    getUsers,
} from '@/lib/api';
import type { DocumentItem, FolderItem, Item } from '@/types';
import UploadModal from '@/components/features/documents/UploadModal';
import { formatDate } from '@/utils/date.utils';

export default function DocumentListing() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [anchorEl, setAnchorEl] = useState<{ element: HTMLElement; itemId: number } | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    //Fetch user ID from database (only one user exists in seeded data)
    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const usersResponse = await getUsers({ page: 1, limit: 1 });
                if (usersResponse?.data?.length > 0) {
                    setUserId(usersResponse.data[0]?.id ?? null);
                }
            } catch (err) {
                console.error('Failed to fetch user:', err);
            }
        };

        fetchUserId();
    }, []);

    //Ensure valid page range when totalPages changes
    useEffect(() => {
        if (totalPages > 0 && page > totalPages) {
            setPage(1);
        }
    }, [totalPages]);

    //Reset to page 1 if no data in other pages
    useEffect(() => {
        if (items.length === 0 && page > 1 && !loading) {
            setPage(1);
        }
    }, [items.length, page, loading]);

    //Calculate totalPages based on combined items response
    const calculateTotalPages = useCallback((combined: Item[], responseTotalPages: number, currentPage: number) => {
        if (combined.length === 0) {
            if (currentPage === 1) {
                return { totalPages: 1, page: 1 };
            } else {
                return { totalPages: 1, page: 1 };
            }
        } else if (currentPage > responseTotalPages) {
            return { totalPages: responseTotalPages, page: responseTotalPages };
        } else {
            return { totalPages: responseTotalPages, page: currentPage };
        }},[]
    );

    //Fetch both documents and folders for the current user
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

            const response = await getUserDocumentsAndFolders(userId, { page, limit: rowsPerPage });

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

            //Set pages
            const { totalPages: newTotalPages, page: newPage } = calculateTotalPages(combined, responseTotalPages, page);
            setTotalPages(newTotalPages);
            if (newPage !== page) {
                setPage(newPage);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load documents');
            setItems([]);
            setTotalPages(1);
            setPage(1);
        } finally {
            setLoading(false);
        }
    }, [userId, page, rowsPerPage]);

    useEffect(() => {
        if (userId !== null) {
            fetchData();
        }
    }, [fetchData, userId]);

    //Filter items by search query
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        
        const query = searchQuery.toLowerCase();
        return items.filter((item) => item?.name?.toLowerCase().includes(query));
    }, [items, searchQuery]);

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedItems(new Set(filteredItems.map((item) => item.id)));
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleSelectItem = (itemId: number) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
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
                await deleteFolder(itemId);
            }
            setItems((prev) => prev.filter((item) => item.id !== itemId));
            setSelectedItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
            handleMenuClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete item');
        }
    };


    const isAllSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedItems.has(item.id));
    const isIndeterminate = selectedItems.size > 0 && selectedItems.size < filteredItems.length;

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
                            borderColor: '#1976d2',
                            color: '#1976d2',
                            '&:hover': {
                                borderColor: '#1565c0',
                                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                            },
                        }}
                    >
                        Upload files
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                            backgroundColor: '#1976d2',
                            '&:hover': {
                                backgroundColor: '#1565c0',
                            },
                        }}
                    >
                        Add new folder
                    </Button>
                </Box>
            </Box>

            {/* Search Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <TextField
                    placeholder="Search"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                        <TableRow sx={{ backgroundColor: '#1565c0' }}>
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
                        ) : filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">
                                        {searchQuery ? 'No items match your search' : 'No documents or folders'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item) => (
                                <TableRow
                                    key={`${item.type}-${item.id}`}
                                    hover
                                    sx={{
                                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => handleSelectItem(item.id)}
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

                {totalPages > 0 && items.length > 0 && (
                    <Pagination
                        count={totalPages}
                        page={Math.min(page, totalPages)}
                        onChange={(_, newPage) => {
                            if (newPage <= totalPages && newPage >= 1 && newPage > 0) {
                                setPage(newPage);
                            }
                        }}
                        color="primary"
                        showFirstButton
                        showLastButton
                        disabled={items.length === 0}
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
                {anchorEl && (
                    <>
                        <MenuItem
                            onClick={() => {
                                const item = items.find((i) => i.id === anchorEl?.itemId);
                                if (item && anchorEl) {
                                    handleDelete(anchorEl.itemId, item.type);
                                }
                            }}
                        >
                            Delete
                        </MenuItem>
                    </>
                )}
            </Menu>

            {/* Upload Modal */}
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
        </Card>
    );
}

