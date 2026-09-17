import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod.validation.pipe';
import { ImportsService } from './imports.service';
import { CreateImportDto } from './dto/create-import.dto';
import { AssignMappingTemplateDto } from './dto/assign-mapping-template.dto';
import { UpdateStagedTransactionDto } from './dto/update-staged-transaction.dto';
import { ImportBatchQuerySchema, ImportBatchQueryType } from './dto/import-batch-query.schema';
import { StagedTransactionQuerySchema, StagedTransactionQueryType } from './dto/staged-transaction-query.schema';

@ApiTags('Imports')
@ApiBearerAuth()
@Controller('imports')
@UseGuards(JwtGuard)
export class ImportsController {
    constructor(private readonly importsService: ImportsService) { }

    @Post()
    @ApiOperation({ summary: 'Upload one or more statement files (one import batch per file)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FilesInterceptor('files'))
    create(
        @CurrentUser('id') userId: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: CreateImportDto,
    ) {
        return this.importsService.createBatches(userId, dto.account_uuid, files);
    }

    @Get()
    @ApiOperation({ summary: 'List import batches' })
    findAll(
        @CurrentUser('id') userId: string,
        @Query(new ZodValidationPipe(ImportBatchQuerySchema)) query: ImportBatchQueryType,
    ) {
        return this.importsService.findAll(userId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an import batch' })
    findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.importsService.findOne(userId, id);
    }

    @Get(':id/staged')
    @ApiOperation({ summary: 'List staged (pre-commit) rows for an import batch' })
    findStaged(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Query(new ZodValidationPipe(StagedTransactionQuerySchema)) query: StagedTransactionQueryType,
    ) {
        return this.importsService.findStaged(userId, id, query);
    }

    @Patch(':id/staged/:stagedId')
    @ApiOperation({ summary: 'Correct, accept, or reject a staged row' })
    updateStaged(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Param('stagedId') stagedId: string,
        @Body() dto: UpdateStagedTransactionDto,
    ) {
        return this.importsService.updateStaged(userId, id, stagedId, dto);
    }

    @Post(':id/mapping-template')
    @ApiOperation({ summary: 'Assign a mapping template to a NEEDS_MAPPING batch and (re)parse it' })
    assignMappingTemplate(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Body() dto: AssignMappingTemplateDto,
    ) {
        return this.importsService.assignMappingTemplate(userId, id, dto.mapping_template_uuid);
    }

    @Post(':id/reparse')
    @ApiOperation({ summary: 'Re-run parsing for a batch (e.g. after fixing its mapping template)' })
    reparse(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.importsService.reparse(userId, id);
    }

    @Post(':id/commit')
    @ApiOperation({ summary: 'Commit accepted staged rows as immutable transactions (partial commit allowed)' })
    commit(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.importsService.commit(userId, id);
    }
}
