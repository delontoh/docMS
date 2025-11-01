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
    if (bytes === 0) return '0 Bytes';

    const k = 1024; // 1024 Bytes in 1 Kilobyte
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizeIndex = Math.min(i, sizes.length - 1);

    const convertedSize = bytes / Math.pow(k, sizeIndex);

    //Round to 2 decimal places, but show integer if it's a whole number
    const roundedSize = Math.round(convertedSize * 100) / 100;
    const formattedSize = roundedSize % 1 === 0 ? roundedSize.toString() : roundedSize.toFixed(2);

    return `${formattedSize} ${sizes[sizeIndex]}`;
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

    const handleUpload = async () => {
        const validFiles = files.filter((f) => f.status === 'pending' && !f.error);
        if (validFiles.length === 0) return;

        setIsUploading(true);
        const successFiles: string[] = [];
        const failedFiles: string[] = [];

        //Check for duplicate names upon upload
        const fileNames = validFiles.map((f) => f.file.name);
        let filesToUpload = validFiles;
        
        try {
            const duplicateCheckResponse = await checkDocumentNamesExist(userId, fileNames);
            const existingNames = duplicateCheckResponse.data.existingNames;
            if (existingNames.length > 0) {
                setFiles((prev) =>
                    prev.map((fileItem) => {
                        if (fileItem.status === 'pending' && !fileItem.error && existingNames.includes(fileItem.file.name)) {
                            return {
                                ...fileItem,
                                status: 'error',
                                error: `A document with the name "${fileItem.file.name}" already exists. Please rename the file or remove the existing document.`,
                            };
                        }
                        return fileItem;
                    })
                );

                //Remove duplicates from files to upload
                filesToUpload = validFiles.filter((fileItem) => !existingNames.includes(fileItem.file.name));
                
                if (filesToUpload.length === 0) {
                    setIsUploading(false);
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to check for duplicate names:', error); //Backend will still catch duplicates
        }

        //Update files to 'uploading' status
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

                //Update file status to success
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

                //Update file status to error
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileItem.id ? { ...f, status: 'error', error: errorMessage } : f
                    )
                );
            }
        }

        setIsUploading(false);
        setUploadResults({ success: successFiles, failed: failedFiles });

        // If there are successful uploads, refresh the list
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
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h6" component="span">
                    Upload
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    disabled={isUploading}
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                    }}
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
                    />
                </Paper>

                {/* Files List */}
                {files.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
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
                                >
                                    <FileIcon sx={{ mr: 2, color: 'action.active' }} />
                                    <ListItemText
                                        primary={fileItem.file.name}
                                        secondary={
                                            <Box>
                                                <Typography variant="caption" component="span">
                                                    {formatFileSize(fileItem.file.size)}
                                                </Typography>
                                                {fileItem.error && (
                                                    <Alert severity="warning" sx={{ mt: 0.5 }}>
                                                        {fileItem.error}
                                                    </Alert>
                                                )}
                                                {fileItem.status === 'uploading' && (
                                                    <LinearProgress sx={{ mt: 1 }} />
                                                )}
                                                {fileItem.status === 'success' && (
                                                    <Typography
                                                        variant="caption"
                                                        color="success.main"
                                                        sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
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
                                                    >
                                                        <ErrorIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                                        {fileItem.error}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleRemoveFile(fileItem.id)}
                                            disabled={fileItem.status === 'uploading'}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {/* Upload Results */}
                {hasResults && (
                    <Box sx={{ mb: 2 }}>
                        {uploadResults.success.length > 0 && (
                            <Alert severity="success" sx={{ mb: 1 }}>
                                {uploadResults.success.length} file(s) uploaded successfully.
                            </Alert>
                        )}
                        {uploadResults.failed.length > 0 && (
                            <Alert severity="error">
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
                            <Button onClick={handleContinue} variant="contained" sx={{ mr: 2 }}>
                                Continue with Remaining Files
                            </Button>
                        )}
                        <Button onClick={handleClose} variant="contained" disabled={isUploading}>
                            Done
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={handleClose} disabled={isUploading}>
                            Cancel
                        </Button>
                        {validFilesCount > 0 && (
                            <Button
                                onClick={handleUpload}
                                variant="contained"
                                disabled={isUploading}
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

