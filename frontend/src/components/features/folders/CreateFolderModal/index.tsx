'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert,
    IconButton,
    CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { createFolder, checkFolderNamesExist } from '@/lib/api';
import { getDocumentsWithoutFolders, assignDocumentsToFolder } from '@/lib/api';
import type { Document, CreateFolderInput } from '@/types';

type CreateFolderModalProps = {
    open: boolean;
    onClose: () => void;
    userId: number;
    onFolderCreated?: () => void;
};

export default function CreateFolderModal({ open, onClose, userId, onFolderCreated }: CreateFolderModalProps) {
    const [folderName, setFolderName] = useState('');
    const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
    const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [folderNameError, setFolderNameError] = useState<string | null>(null);

    //Fetch documents without folders when modal opens
    useEffect(() => {
        if (open && userId) {
            fetchAvailableDocuments();
        }
    }, [open, userId]);

    const fetchAvailableDocuments = useCallback(async () => {
        try {
            setLoadingDocuments(true);
            setError(null);

            const response = await getDocumentsWithoutFolders(userId);
            setAvailableDocuments(response?.data || []);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load documents');
        } finally {
            setLoadingDocuments(false);
        }
    }, [userId]);

    //Validate folder name for duplicates
    const validateFolderName = useCallback(async (name: string): Promise<boolean> => {
        if (!name.trim()) {
            setFolderNameError('Folder name is required');
            return false;
        }

        try {
            const response = await checkFolderNamesExist(userId, [name.trim()]);
            const existingNames = response?.data?.existingNames || [];
            
            if (existingNames.length > 0) {
                setFolderNameError(`A folder with the name "${name.trim()}" already exists. Please choose a different name.`);
                return false;
            }
            
            setFolderNameError(null);
            return true;
        } catch (err) {
            console.error('Failed to check folder name:', err);
            setFolderNameError(null);
            return true;
        }
    }, [userId]);

    //Validate folder name on change
    useEffect(() => {
        if (folderName.trim()) {
            const timer = setTimeout(() => {
                validateFolderName(folderName);
            }, 500);

            return () => clearTimeout(timer);
        } else {
            setFolderNameError(null);
        }
    }, [folderName, validateFolderName]);

    const handleClose = () => {
        setFolderName('');
        setSelectedDocuments([]);
        setError(null);
        setFolderNameError(null);
        onClose();
    };

    const handleCreateFolder = async () => {
        if (!folderName.trim()) {
            setFolderNameError('Folder name is required');
            return;
        }
        const isValid = await validateFolderName(folderName);
        if (!isValid) return;

        try {
            setLoading(true);
            setError(null);

            const folderData: CreateFolderInput = {
                name: folderName.trim(),
                folders_user_id: userId,
            };

            const folderResponse = await createFolder(folderData);
            const createdFolderId = folderResponse?.data?.id;

            if (!createdFolderId) {
                throw new Error('Failed to create folder');
            }

            //Assign selected documents to folder if any
            if (selectedDocuments.length > 0 && createdFolderId) {
                await assignDocumentsToFolder(selectedDocuments, createdFolderId);
            }

            if (onFolderCreated) {
                onFolderCreated();
            }
            handleClose();
            
        } catch (err) {
            let errorMessage = 'Failed to create folder';
            
            if (err && typeof err === 'object' && 'error' in err) {
                errorMessage = (err as { error: string }).error;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth data-testid="create-folder-modal">
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h6" component="span" data-testid="create-folder-modal-title">
                    Create Folder
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    disabled={loading}
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                    }}
                    data-testid="create-folder-close-button"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)} data-testid="create-folder-error-alert">
                        {error}
                    </Alert>
                )}

                {/* Folder Name Input */}
                <TextField
                    fullWidth
                    label="Folder Name"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    error={!!folderNameError}
                    helperText={folderNameError}
                    disabled={loading}
                    sx={{ mb: 2, mt: 3 }}
                    autoFocus
                    data-testid="create-folder-name-input"
                />

                {/* Document Selection */}
                <Box sx={{ mb: 2, mt: 2 }}>
                    <FormControl fullWidth disabled={loading || loadingDocuments}>
                        <InputLabel id="select-documents-label">Select Documents (Optional)</InputLabel>

                        <Select
                            labelId="select-documents-label"
                            multiple
                            value={selectedDocuments}
                            onChange={(e) => setSelectedDocuments(e.target.value as number[])}
                            label="Select Documents (Optional)"
                            data-testid="create-folder-documents-select"
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((docId) => {
                                        const doc = availableDocuments.find((d) => d.id === docId);
                                        return doc ? (
                                            <Chip key={docId} label={doc.name} size="small" />
                                        ) : null;
                                    })}
                                </Box>
                            )}
                        >
                            {loadingDocuments ? (
                                <MenuItem disabled data-testid="create-folder-loading-documents">
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    Loading documents...
                                </MenuItem>
                            ) : availableDocuments.length === 0 ? (
                                <MenuItem disabled data-testid="create-folder-no-documents">No documents available (all documents are already in folders)</MenuItem>
                            ) : (
                                availableDocuments.map((doc) => (
                                    <MenuItem key={doc.id} value={doc.id} data-testid={`create-folder-document-option-${doc.id}`}>
                                        {doc.name}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>

                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }} data-testid="create-folder-documents-hint">
                        Select documents not currently in any folder to add them to this new folder
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={loading} data-testid="create-folder-cancel-button">
                    Cancel
                </Button>
                <Button onClick={handleCreateFolder} variant="contained" disabled={loading || !!folderNameError || !folderName.trim()} data-testid="create-folder-submit-button">
                    {loading ? 'Creating...' : 'Create Folder'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

