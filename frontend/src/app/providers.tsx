'use client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { makeStore } from '@/lib/store';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#0909B7',
            dark: '#07079E',
            light: '#2B2BC7',
            contrastText: '#ffffff',
        },
    },
});

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
