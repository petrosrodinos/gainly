export const GcsFolders = {
    documents: 'documents',
    avatars: 'avatars',
    uploads: 'uploads',
    imports: 'imports',
    reports: 'reports',
    'tax-forms': 'tax-forms',
} as const;

export type GcsFolderKey = keyof typeof GcsFolders;
export type GcsFolderPath = (typeof GcsFolders)[GcsFolderKey];

export const DEFAULT_GCS_FOLDER = GcsFolders.documents;
