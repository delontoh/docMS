'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    CircularProgress,
    Alert,
} from '@mui/material';
import { Close as CloseIcon, FolderOutlined as FolderIcon, DescriptionOutlined as DescriptionIcon } from '@mui/icons-material';
import { getFolderById } from '@/lib/api';
import { formatDate } from '@/lib/utils/date.utils';
import type { Folder, Document } from '@/types';

type ViewFolderModalProps = {
    open: boolean;
    onClose: () => void;
    folderId: number;
};

export default function ViewFolderModal({ open, onClose, folderId }: ViewFolderModalProps) {
    const [folder, setFolder] = useState<Folder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFolder = useCallback(async () => {
        if (!folderId) return;

        try {
            setLoading(true);
            setError(null);
            const response = await getFolderById(folderId);
            if (response.success && response.data) {
                setFolder(response.data);
            } else {
                setError('Failed to load folder');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load folder');
        } finally {
            setLoading(false);
        }
    }, [folderId]);

    useEffect(() => {
        if (open && folderId) {
            fetchFolder();
        } else {
            setFolder(null);
            setError(null);
        }
    }, [open, folderId, fetchFolder]);

    const handleClose = () => {
        setFolder(null);
        setError(null);
        onClose();
    };

    const documents = (folder?.documents as Document[]) || [];

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderIcon sx={{ color: '#ff9800', fontSize: 24 }} />
                    <Typography variant="h6" component="span">
                        {folder?.name || 'Folder Details'}
                    </Typography>
                </Box>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    disabled={loading}
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : folder ? (
                    <Box>
                        {/* Folder Info */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Created by: {folder.created_by?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Created on: {folder.created_at ? formatDate(folder.created_at) : 'Unknown'}
                            </Typography>
                        </Box>

                        {/* Documents in folder */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                ({documents.length}) document(s) in this folder
                            </Typography>
                            
                            {documents.length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body2" color="textSecondary">
                                        No documents in this folder
                                    </Typography>
                                </Paper>
                            ) : (
                                <Paper>
                                    <List>
                                        {documents.map((doc) => (
                                            <ListItem
                                                key={doc.id}
                                                sx={{
                                                    borderBottom: '1px solid',
                                                    borderColor: 'divider',
                                                    '&:last-child': {
                                                        borderBottom: 'none',
                                                    },
                                                }}
                                            >
                                                <DescriptionIcon sx={{ color: '#1976d2', fontSize: 20, mr: 2 }} />
                                                <ListItemText
                                                    primary={doc.name}
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="caption" component="span" sx={{ display: 'block' }}>
                                                                Size: {doc.file_size || 'N/A'}
                                                            </Typography>
                                                            <Typography variant="caption" component="span" sx={{ display: 'block' }}>
                                                                Created: {doc.created_at ? formatDate(doc.created_at) : 'Unknown'}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            )}
                        </Box>
                    </Box>
                ) : null}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

