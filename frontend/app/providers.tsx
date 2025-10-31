'use client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { makeStore } from '@/lib/store';

const theme = createTheme({ palette: { mode: 'light' } });

export default function Providers({ children }: { children: ReactNode }) {
    const store = makeStore();
    return (
        <ReduxProvider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ReduxProvider>
    );
}
