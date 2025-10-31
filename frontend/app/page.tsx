"use client";
import { gql, useQuery } from '@apollo/client';
import { Box, Container, Typography, Button } from '@mui/material';

const HEALTH_QUERY = gql`
  query Health {
    health
  }
`;

export default function HomePage() {
  const { data, loading, error, refetch } = useQuery(HEALTH_QUERY);
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          DocMS
        </Typography>
        <Typography variant="body1" gutterBottom>
          GraphQL health: {loading ? 'Loading...' : error ? 'Error' : data?.health}
        </Typography>
        <Button variant="contained" onClick={() => refetch()}>Refetch</Button>
      </Box>
    </Container>
  );
}

