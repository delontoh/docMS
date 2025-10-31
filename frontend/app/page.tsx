'use client';

import { useState, useEffect, useMemo } from 'react';
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
    Folder as FolderIcon,
    Description as DescriptionIcon,
    MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';
import {
    getDocuments,
    getFolders,
    deleteDocument,
    deleteFolder,
    type Document,
    type Folder,
} from '@/lib/api-client';

type DocumentItem = Document & { type: 'document' };
type FolderItem = Folder & { type: 'folder' };
type Item = DocumentItem | FolderItem;

export default function DocumentsPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [anchorEl, setAnchorEl] = useState<{ element: HTMLElement; itemId: number } | null>(null);

    // Fetch documents and folders
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [documentsResponse, foldersResponse] = await Promise.all([
                    getDocuments({ page, limit: rowsPerPage }),
                    getFolders({ page, limit: rowsPerPage }),
                ]);

                const documents: DocumentItem[] = documentsResponse.data.map((doc) => ({
                    ...doc,
                    type: 'document' as const,
                }));

                const folders: FolderItem[] = foldersResponse.data.map((folder) => ({
                    ...folder,
                    type: 'folder' as const,
                }));

                // Combine and sort by date (newest first)
                const combined = [...documents, ...folders].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                setItems(combined);
                setTotal(documentsResponse.total + foldersResponse.total);
                setTotalPages(Math.ceil((documentsResponse.total + foldersResponse.total) / rowsPerPage));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load documents');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [page, rowsPerPage]);

    // Filter items by search query
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const query = searchQuery.toLowerCase();
        return items.filter((item) => item.name.toLowerCase().includes(query));
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
            // Refresh the list
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const isAllSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedItems.has(item.id));
    const isIndeterminate = selectedItems.size > 0 && selectedItems.size < filteredItems.length;

    return (
        <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
                Frontend
            </Typography>

            <Card sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
                {/* Header Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                        Documents
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {/* Search Bar */}
                        <TextField
                            placeholder="Search"
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: 250 }}
                        />

                        {/* Upload Files Button */}
                        <Button
                            variant="outlined"
                            startIcon={<UploadIcon />}
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

                        {/* Add New Folder Button */}
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

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Table */}
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
                                                <Typography variant="body2">{item.name}</Typography>
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
                                            <Typography variant="body2">{formatDate(item.created_at)}</Typography>
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

                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, newPage) => setPage(newPage)}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            </Card>

            {/* Action Menu */}
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
                                const item = items.find((i) => i.id === anchorEl.itemId);
                                if (item) {
                                    handleDelete(anchorEl.itemId, item.type);
                                }
                            }}
                        >
                            Delete
                        </MenuItem>
                    </>
                )}
            </Menu>
        </Box>
    );
}
