'use client';

import { useState, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Alert,
    Paper,
    LinearProgress,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    CloudUpload as CloudUploadIcon,
    InsertDriveFile as FileIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { createDocument, checkDocumentNamesExist } from '@/lib/api';
import type { CreateDocumentInput } from '@/types';

type FileWithPreview = {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
};

type UploadModalProps = {
    open: boolean;
    onClose: () => void;
    userId: number;
    onUploadSuccess?: () => void;
};

const ALLOWED_EXTENSIONS = ['.docx', '.xlsx', '.pdf']; // Allowed file type extensions: [.docx, .xlsx, .pdf]
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 KB';

    const kb = bytes / 1024;
    if (kb >= 1024) {
        const mb = kb / 1024;
        const rounded = Math.round(mb * 100) / 100;
        const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
        return `${formatted} MB`;
    }

    const rounded = Math.round(kb * 100) / 100;
    const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
    return `${formatted} KB`;
};

const getFileExtension = (filename: string): string => {
    return filename.substring(filename.lastIndexOf('.')).toLowerCase();
};

const validateFile = (file: File): string | null => {
    //Check file extension types
    const extension = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return `File type ${extension} is not allowed. Only ${ALLOWED_EXTENSIONS.join(', ')} files are supported.`;
    }

    //Check file size not empty
    if (file.size === 0) {
        return 'File is empty. Please select a file with content.';
    }

    //Check file size limit
    if (file.size > MAX_FILE_SIZE) {
        return `File size (${formatFileSize(file.size)}) exceeds the maximum limit of ${formatFileSize(MAX_FILE_SIZE)}.`;
    }
    return null;
};

export default function UploadModal({ open, onClose, userId, onUploadSuccess }: UploadModalProps) {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState<{ success: string[]; failed: string[] }>({
        success: [],
        failed: [],
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    //Validate files and check for duplicate names
    const processFiles = useCallback((fileList: FileList | null) => {
        if (!fileList) return;

        const newFiles: FileWithPreview[] = [];

        Array.from(fileList).forEach((file, index) => {
            const error = validateFile(file);

            //Check for duplicate names within upload list
            let duplicateError = error;
            if (!duplicateError) {
                const existingFileNames = files.map((f) => f.file.name);
                if (existingFileNames.includes(file.name)) {
                    duplicateError = `A file with the name "${file.name}" is already in the upload list.`;
                }
            }

            //Check for duplicate names within new files added
            if (!duplicateError) {
                const duplicateInNewFiles = newFiles.some((f) => f.file.name === file.name);
                if (duplicateInNewFiles) {
                    duplicateError = `Multiple files with the name "${file.name}" are being added. Please rename one of them.`;
                }
            }

            const fileId = `${Date.now()}-${Math.random()}-${index}`;
            newFiles.push({
                id: fileId,
                file,
                status: duplicateError ? 'error' : 'pending',
                error: duplicateError || undefined,
            });
        });

        setFiles((prev) => [...prev, ...newFiles]);
    }, [files]);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const droppedFiles = e.dataTransfer.files;
            processFiles(droppedFiles);
        },
        [processFiles]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            processFiles(e.target.files);
            //Reset input so same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        [processFiles]
    );

    const handleRemoveFile = useCallback((fileId: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }, []);

   //Check for duplicate document names
    const checkAndFilterDuplicates = useCallback(async (validFiles: FileWithPreview[]): Promise<FileWithPreview[]> => {
        const fileNames = validFiles.map((f) => f.file.name);
        
        try {
            const duplicateCheckResponse = await checkDocumentNamesExist(userId, fileNames);
            const existingNames = duplicateCheckResponse?.data?.existingNames || [];
            
            if (existingNames.length > 0) {
                setFiles((prev) =>
                    prev.map((fileItem) => {
                        if (fileItem.status === 'pending' && !fileItem.error && existingNames.includes(fileItem.file.name)) {
                            return {
                                ...fileItem,
                                status: 'error',
                                error: `A document with the name "${fileItem.file.name}" already exists. Please remove and rename the document.`,
                            };
                        }
                        return fileItem;
                    })
                );

                //Return files without duplicates
                return validFiles.filter((fileItem) => !existingNames.includes(fileItem.file.name));
            }

        } catch (error) {
            console.error('Failed to check for duplicate names:', error);
        }
        return validFiles;
    }, [userId]);

    const handleUpload = async () => {
        const validFiles = files.filter((f) => f.status === 'pending' && !f.error);
        if (validFiles.length === 0) return;

        setIsUploading(true);
        const successFiles: string[] = [];
        const failedFiles: string[] = [];

        const filesToUpload = await checkAndFilterDuplicates(validFiles);
        
        if (filesToUpload.length === 0) {
            setIsUploading(false);
            return;
        }

        setFiles((prev) =>
            prev.map((fileItem) => {
                const shouldUpload = filesToUpload.some((fileToUpload) => fileToUpload.id === fileItem.id);
                return shouldUpload ? { ...fileItem, status: 'uploading' } : fileItem;
            })
        );

        //Upload files sequentially
        for (const fileItem of filesToUpload) {
            try {
                const fileSizeStr = `${Math.round(fileItem.file.size / 1024)} KB`;
                const documentData: CreateDocumentInput = {
                    name: fileItem.file.name,
                    file_size: fileSizeStr,
                    document_user_id: userId,
                    folder_document_id: null,
                };

                await createDocument(documentData);
                successFiles.push(fileItem.file.name);

                setFiles((prev) =>
                    prev.map((f) => (f.id === fileItem.id ? { ...f, status: 'success' } : f))
                );

            } catch (error) {
                let errorMessage = 'Upload failed';
                
                // Extract error message from API response if available
                if (error && typeof error === 'object' && 'error' in error) {
                    errorMessage = (error as { error: string }).error;
                } else if (error instanceof Error) {
                    errorMessage = error.message;
                }
                
                failedFiles.push(fileItem.file.name);
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileItem.id ? { ...f, status: 'error', error: errorMessage } : f
                    )
                );
            }
        }

        setIsUploading(false);
        setUploadResults({ success: successFiles, failed: failedFiles });

        if (successFiles.length > 0 && onUploadSuccess) {
            onUploadSuccess();
        }
    };

    const handleClose = () => {
        setFiles([]);
        setIsUploading(false);
        setUploadResults({ success: [], failed: [] });
        onClose();
    };

    const handleContinue = () => {
        //Remove successful files and keep failed ones for retry
        setFiles((prev) => prev.filter((f) => f.status !== 'success'));
        setUploadResults({ success: [], failed: [] });
    };

    const validFilesCount = files.filter((f) => f.status === 'pending' && !f.error).length;
    const hasResults = uploadResults.success.length > 0 || uploadResults.failed.length > 0;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth data-testid="upload-modal">
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h6" component="span" data-testid="upload-modal-title">
                    Upload
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    disabled={isUploading}
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                    }}
                    data-testid="upload-close-button"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {/* Drag and Drop Area */}
                <Paper
                    sx={{
                        p: 4,
                        border: '2px dashed',
                        borderColor: isDragging ? 'primary.main' : 'grey.300',
                        backgroundColor: isDragging ? 'action.hover' : 'background.paper',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        mb: 3,
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="upload-drop-zone"
                >
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />

                    <Typography variant="h6" gutterBottom>
                        Drag and drop files here
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        or click to browse
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        Supported formats: DOCX, XLSX, PDF (Max 5MB per file)
                    </Typography>

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".docx,.xlsx,.pdf"
                        onChange={handleFileInput}
                        style={{ display: 'none' }}
                        data-testid="upload-file-input"
                    />
                </Paper>

                {/* Files List */}
                {files.length > 0 && (
                    <Box sx={{ mb: 2 }} data-testid="upload-files-list-container">
                        <Typography variant="subtitle2" gutterBottom data-testid="upload-files-list-header">
                            Files Ready to Upload ({validFilesCount} valid)
                        </Typography>
                        <List>
                            {files.map((fileItem) => (
                                <ListItem
                                    key={fileItem.id}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        mb: 1,
                                        bgcolor: 'background.paper',
                                    }}
                                    data-testid={`upload-file-item-${fileItem.id}`}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleRemoveFile(fileItem.id)}
                                            disabled={fileItem.status === 'uploading'}
                                            data-testid={`upload-remove-file-${fileItem.id}`}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                >
                                    <FileIcon sx={{ mr: 2, color: 'action.active' }} />
                                    <ListItemText
                                        primary={fileItem.file.name}
                                        secondary={
                                            <Box>
                                                <Typography variant="caption" component="span">
                                                    {formatFileSize(fileItem.file.size)}
                                                </Typography>
                                                {fileItem.status === 'uploading' && (
                                                    <LinearProgress sx={{ mt: 1 }} data-testid={`upload-progress-${fileItem.id}`} />
                                                )}
                                                {fileItem.status === 'success' && (
                                                    <Typography
                                                        variant="caption"
                                                        color="success.main"
                                                        sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                                                        data-testid={`upload-success-${fileItem.id}`}
                                                    >
                                                        <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                                        Uploaded successfully
                                                    </Typography>
                                                )}
                                                {fileItem.status === 'error' && fileItem.error && (
                                                    <Typography
                                                        variant="caption"
                                                        color="error.main"
                                                        sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                                                        data-testid={`upload-error-${fileItem.id}`}
                                                    >
                                                        <ErrorIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                                        {fileItem.error}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {/* Upload Results */}
                {hasResults && (
                    <Box sx={{ mb: 2 }} data-testid="upload-results">
                        {uploadResults.success.length > 0 && (
                            <Alert severity="success" sx={{ mb: 1 }} data-testid="upload-success-alert">
                                {uploadResults.success.length} file(s) uploaded successfully.
                            </Alert>
                        )}
                        {uploadResults.failed.length > 0 && (
                            <Alert severity="error" data-testid="upload-error-alert">
                                {uploadResults.failed.length} file(s) failed to upload. You can remove failed files
                                and try again.
                            </Alert>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    justifyContent: hasResults && validFilesCount === 0 ? 'center' : 'flex-end',
                    px: 3,
                    pb: 2,
                }}
            >
                {hasResults && validFilesCount === 0 ? (
                    <>
                        {uploadResults.failed.length > 0 && (
                            <Button onClick={handleContinue} variant="contained" sx={{ mr: 2 }} data-testid="upload-continue-button">
                                Continue with Remaining Files
                            </Button>
                        )}
                        <Button onClick={handleClose} variant="contained" disabled={isUploading} data-testid="upload-done-button">
                            Done
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={handleClose} disabled={isUploading} data-testid="upload-cancel-button">
                            Cancel
                        </Button>
                        {validFilesCount > 0 && (
                            <Button
                                onClick={handleUpload}
                                variant="contained"
                                disabled={isUploading}
                                data-testid="upload-submit-button"
                            >
                                {isUploading ? 'Uploading...' : `Upload ${validFilesCount} File(s)`}
                            </Button>
                        )}
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}

