import { Box, Container, Typography } from '@mui/material';
import DocumentListing from '@/components/features/listing/DocumentListing/DocumentListing';

export default function DocumentsPage() {
    return (
        <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
            <Container maxWidth="lg">
                <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
                    Document Management System
                </Typography>
                <DocumentListing />
            </Container>
        </Box>
    );
}
