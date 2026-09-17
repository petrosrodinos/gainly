import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod.validation.pipe';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentQuerySchema, DocumentQueryType } from './dto/document-query.schema';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtGuard)
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Post()
    @ApiOperation({ summary: 'Upload a document' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    upload(
        @CurrentUser('id') userId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadDocumentDto,
    ) {
        return this.documentsService.upload(userId, file, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List documents' })
    findAll(
        @CurrentUser('id') userId: string,
        @Query(new ZodValidationPipe(DocumentQuerySchema)) query: DocumentQueryType,
    ) {
        return this.documentsService.findAll(userId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a document (includes a temporary signed URL)' })
    findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.documentsService.findOne(userId, id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a document' })
    remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.documentsService.remove(userId, id);
    }
}
