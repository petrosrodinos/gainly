import { DocumentCategory, DocumentType } from 'generated/prisma';
import { GcsFolderPath } from '@/integrations/storage/gcs/config/gcs-folders.config';

export interface CreateDocumentFromBufferParams {
    userUuid: string;
    buffer: Buffer;
    filename: string;
    contentType: string;
    folder: GcsFolderPath;
    type?: DocumentType;
    category?: DocumentCategory;
    import_batch_uuid?: string | null;
}
