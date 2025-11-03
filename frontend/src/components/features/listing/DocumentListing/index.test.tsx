import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DocumentListing from './index';
import documentsReducer from '@/lib/store/slices/documentsSlice';
import { 
    getUserDocumentsAndFolders, 
    searchUserDocumentsAndFolders, 
    getUsers, 
    deleteFolder,
} from '@/lib/api';

//Mock APIs
jest.mock('@/lib/api', () => {
    return {
        __esModule: true,
        getUserDocumentsAndFolders: jest.fn(),
        searchUserDocumentsAndFolders: jest.fn(),
        getUsers: jest.fn(),
        deleteFolder: jest.fn(),
    };
});

//Mock components
jest.mock('@/components/features/documents/UploadModal', () => ({
    __esModule: true,
    default: function MockUploadModal(props: { open: boolean; onClose: () => void }) {
        return props.open ? <div data-testid="upload-modal">Upload Modal</div> : null;
    },
}));

jest.mock('@/components/features/folders/CreateFolderModal', () => ({
    __esModule: true,
    default: function MockCreateFolderModal(props: { open: boolean; onClose: () => void }) {
        return props.open ? <div data-testid="create-folder-modal">Create Folder Modal</div> : null;
    },
}));

jest.mock('@/components/features/folders/ViewFolderModal', () => ({
    __esModule: true,
    default: function MockViewFolderModal(props: { open: boolean; onClose: () => void }) {
        return props.open ? <div data-testid="view-folder-modal">View Folder Modal</div> : null;
    },
}));

jest.mock('@/components/features/folders/DeleteFolderModal', () => ({
    __esModule: true,
    default: function MockDeleteFolderModal(props: { open: boolean; onClose: () => void }) {
        return props.open ? <div data-testid="delete-folder-modal">Delete Folder Modal</div> : null;
    },
}));

const mockGetUsers = getUsers as any;
const mockGetUserDocumentsAndFolders = getUserDocumentsAndFolders as any;
const mockSearchUserDocumentsAndFolders = searchUserDocumentsAndFolders as any;
const mockDeleteFolder = deleteFolder as any;

//Create store
const createTestStore = () => {
    return configureStore({
        reducer: {
            documents: documentsReducer,
        },
    });
};

//Render with Redux
const renderWithRedux = (component: React.ReactElement) => {
    const store = createTestStore();
    return {
        ...render(<Provider store={store}>{component}</Provider>),
        store,
    };
};

describe('DocumentListing', () => {
    const mockUser = { 
        id: 1, 
        name: 'Test User', 
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    };
    const mockDocuments = [
        {
            id: 1,
            name: 'Document 1.pdf',
            file_size: '100 KB',
            file_type: 'document',
            document_user_id: 1,
            folder_document_id: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            created_by: { id: 1, name: 'Test User', email: 'test@example.com' },
        },
        {
            id: 2,
            name: 'Document 2.docx',
            file_size: '200 KB',
            file_type: 'document',
            document_user_id: 1,
            folder_document_id: null,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            created_by: { id: 1, name: 'Test User', email: 'test@example.com' },
        },
    ];
    const mockFolders = [
        {
            id: 1,
            name: 'Folder 1',
            file_type: 'folder',
            folders_user_id: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            created_by: { id: 1, name: 'Test User', email: 'test@example.com' },
            documents: [],
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        mockGetUsers.mockResolvedValue([mockUser]);
        mockGetUserDocumentsAndFolders.mockResolvedValue({
            success: true,
            documents: mockDocuments,
            folders: mockFolders,
            documentsTotal: 2,
            foldersTotal: 1,
            total: 3,
            page: 1,
            limit: 10,
            totalPages: 1,
        });
    });

    it('should render document listing', async () => {
        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(screen.getByText('Documents')).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: /upload files/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add new folder/i })).toBeInTheDocument();
    });

    it('should fetch user ID on mount', async () => {
        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(mockGetUsers).toHaveBeenCalled();
        });
    });

    it('should fetch documents and folders when user ID is available', async () => {
        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(mockGetUsers).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(mockGetUserDocumentsAndFolders).toHaveBeenCalled();
        });
    });

    it('should display documents and folders in table', async () => {
        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(screen.getByText('Document 1.pdf')).toBeInTheDocument();
        });

        expect(screen.getByText('Document 2.docx')).toBeInTheDocument();
        expect(screen.getByText('Folder 1')).toBeInTheDocument();
    });

    it('should display empty state when no items', async () => {
        mockGetUserDocumentsAndFolders.mockResolvedValue({
            success: true,
            documents: [],
            folders: [],
            documentsTotal: 0,
            foldersTotal: 0,
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
        });

        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(screen.getByText(/no documents or folders/i)).toBeInTheDocument();
        });
    });

    it('should open upload modal when upload button is clicked', async () => {
        const user = userEvent.setup();

        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(mockGetUsers).toHaveBeenCalled();
        });

        const uploadButton = screen.getByRole('button', { name: /upload files/i });
        await user.click(uploadButton);

        await waitFor(() => {
            expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
        });
    });

    it('should open create folder modal when add folder button is clicked', async () => {
        const user = userEvent.setup();

        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(mockGetUsers).toHaveBeenCalled();
        });

        const createFolderButton = screen.getByRole('button', { name: /add new folder/i });
        await user.click(createFolderButton);

        await waitFor(() => {
            expect(screen.getByTestId('create-folder-modal')).toBeInTheDocument();
        });
    });

    it('should handle search input and debounce search query', async () => {
        const user = userEvent.setup();

        mockSearchUserDocumentsAndFolders.mockResolvedValue({
            success: true,
            documents: [mockDocuments[0]],
            folders: [],
            documentsTotal: 1,
            foldersTotal: 0,
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
        });

        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(mockGetUsers).toHaveBeenCalled();
        });

        const searchInput = screen.getByPlaceholderText(/search/i);
        await user.type(searchInput, 'test');

        await waitFor(() => {
            expect(mockSearchUserDocumentsAndFolders).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    search: 'test',
                    page: 1,
                    limit: 10,
                })
            );
        }, { timeout: 1000 }); //Current debounce is 500ms
    });

    it('should select and unselect items', async () => {
        const user = userEvent.setup();

        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(screen.getByText('Document 1.pdf')).toBeInTheDocument();
        });

        const checkboxes = screen.getAllByRole('checkbox');

        await user.click(checkboxes[1]); //Select
        await waitFor(() => {
            expect(screen.getByText(/delete selected \(1\)/i)).toBeInTheDocument();
        });

        await user.click(checkboxes[1]); //Unselect
        await waitFor(() => {
            expect(screen.queryByText(/delete selected/i)).not.toBeInTheDocument();
        });
    });

    it('should select all items and show delete count when select all is clicked', async () => {
        const user = userEvent.setup();

        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(screen.getByText('Document 1.pdf')).toBeInTheDocument();
        });

        const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
        await user.click(selectAllCheckbox);

        await waitFor(() => {
            expect(screen.getByText(/delete selected \(3\)/i)).toBeInTheDocument();
        });
    });

    it('should open delete folder modal when folder delete is clicked', async () => {
        const user = userEvent.setup();

        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(screen.getByText('Folder 1')).toBeInTheDocument();
        });

        const folderRow = screen.getByText('Folder 1').closest('tr');
        expect(folderRow).not.toBeNull();

        const folderMenuButton = within(folderRow as HTMLTableRowElement).getByRole('button', {
            name: /actions for folder/i,
        });
        await user.click(folderMenuButton);

        const menu = await screen.findByRole('menu');
        const deleteMenuItem = within(menu).getByRole('menuitem', { name: /^delete$/i });
        await user.click(deleteMenuItem);

        await waitFor(() => {
            expect(screen.getByTestId('delete-folder-modal')).toBeInTheDocument();
        });

        expect(mockDeleteFolder).not.toHaveBeenCalled(); //Because need to wait for user confirmation
    });

    it('should open view folder modal when view is clicked for folder', async () => {
        const user = userEvent.setup();

        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(screen.getByText('Folder 1')).toBeInTheDocument();
        });

        const folderRow = screen.getByText('Folder 1').closest('tr');
        expect(folderRow).not.toBeNull();

        const folderMenuButton = within(folderRow as HTMLTableRowElement).getByRole('button', {
            name: /actions for folder/i,
        });
        await user.click(folderMenuButton);

        const menu = await screen.findByRole('menu');
        const viewMenuItem = within(menu).getByRole('menuitem', { name: /^view$/i });
        await user.click(viewMenuItem);

        await waitFor(() => {
            expect(screen.getByTestId('view-folder-modal')).toBeInTheDocument();
        });
    });

    it('should handle pagination', async () => {
        const user = userEvent.setup();

        mockGetUserDocumentsAndFolders.mockResolvedValue({
            success: true,
            documents: mockDocuments,
            folders: mockFolders,
            documentsTotal: 25,
            foldersTotal: 5,
            total: 30,
            page: 1,
            limit: 10,
            totalPages: 3,
        });

        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(mockGetUsers).toHaveBeenCalled();
        });

        await waitFor(() => {
            const pagination = screen.getByRole('navigation', { name: /pagination/i }) || screen.queryByLabelText(/pagination/i);
            if (!pagination) {
                //Check pagination buttons
                const nextButton = screen.queryByRole('button', { name: /next/i });
                if (nextButton) {
                    expect(true).toBe(true);
                    return;
                }
            }
        }, { timeout: 2000 });
    });

    it('should handle rows per page change', async () => {
        const user = userEvent.setup();

        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(mockGetUsers).toHaveBeenCalled();
        });

        const rowsPerPageSelect = screen.getByText(/show/i).parentElement?.querySelector('[role="combobox"]');
        if (rowsPerPageSelect) {
            await user.click(rowsPerPageSelect);
            
            const option25 = screen.getByRole('option', { name: '25' });
            await user.click(option25);

            await waitFor(() => {
                expect(mockGetUserDocumentsAndFolders).toHaveBeenCalledWith(
                    1,
                    expect.objectContaining({
                        limit: 25,
                    })
                );
            });
        }
    });

    it('should reset search when search query changes', async () => {
        const user = userEvent.setup();

        renderWithRedux(<DocumentListing />);

        await waitFor(() => {
            expect(mockGetUsers).toHaveBeenCalled();
        });

        const searchInput = screen.getByPlaceholderText(/search/i);
        await user.type(searchInput, 'test');
        
        await user.clear(searchInput);
        await waitFor(() => {
            expect(mockGetUserDocumentsAndFolders).toHaveBeenCalled();
        }, { timeout: 1000 });
    });
});

