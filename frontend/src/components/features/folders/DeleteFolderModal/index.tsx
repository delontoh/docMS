'use client';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Alert,
} from '@mui/material';

type DeleteFolderModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    folderName?: string;
    folderCount?: number;
    folderNames?: string[];
};

export default function DeleteFolderModal({
    open,
    onClose,
    onConfirm,
    folderName,
    folderCount,
    folderNames,
}: DeleteFolderModalProps) {
    
    const isBulkDelete = folderCount !== undefined && folderCount > 0;

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{isBulkDelete ? 'Delete Folders' : 'Delete Folder'}</DialogTitle>

            <DialogContent>
                {isBulkDelete ? (
                    <>
                        <Typography>
                            Are you sure you want to delete {folderCount} folder(s)?
                        </Typography>
                        {folderNames && folderNames.length > 0 && (
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Folders to delete:
                                </Typography>
                                <Box sx={{ maxHeight: 150, overflowY: 'auto', pl: 1 }}>
                                    {folderNames.map((name, index) => (
                                        <Typography key={index} variant="body2" sx={{ pl: 1 }}>
                                            • {name}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        )}
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Box>
                                <Typography variant="body2">
                                    Note:
                                </Typography>
                                <Typography variant="body2">
                                    Deleting the folders will not delete the documents inside them.
                                </Typography>
                                <Typography variant="body2">
                                    The documents will be removed from these folders but will remain in your documents list.
                                </Typography>
                            </Box>
                        </Alert>
                    </>
                ) : (
                    <>
                        <Typography>
                            Are you sure you want to delete this folder &quot;{folderName}&quot; ?
                        </Typography>
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Box>
                                <Typography variant="body2">
                                    Note:
                                </Typography>
                                <Typography variant="body2">
                                    Deleting the folder will not delete the documents inside it.
                                </Typography>
                                <Typography variant="body2">
                                    The documents will be removed from this folder but will remain in your documents list.
                                </Typography>
                            </Box>
                        </Alert>
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} variant="contained" color="error">
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}

