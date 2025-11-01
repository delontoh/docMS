export type User = {
    id: number;
    email: string;
    name: string;
    created_at: string;
    updated_at: string;
};

export type CreateUserInput = {
    email: string;
    name: string;
};

export type UpdateUserInput = {
    email?: string;
    name?: string;
};

