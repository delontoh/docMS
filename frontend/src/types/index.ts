export type {
    Document,
    CreateDocumentInput,
    DocumentItem,
} from './document.types';

export type {
    Folder,
    CreateFolderInput,
    FolderItem,
} from './folder.types';

export type {
    User
} from './user.types';

export type { PaginatedResponse } from './common.types';

//Combined component types
import type { DocumentItem } from './document.types';
import type { FolderItem } from './folder.types';

export type Item = DocumentItem | FolderItem;

