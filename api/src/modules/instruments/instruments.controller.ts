import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod.validation.pipe';
import { InstrumentsService } from './instruments.service';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';
import { InstrumentQuerySchema, InstrumentQueryType } from './dto/instrument-query.schema';
import { Instrument } from './entities/instrument.entity';

@ApiTags('Instruments')
@ApiBearerAuth()
@Controller('instruments')
@UseGuards(JwtGuard)
export class InstrumentsController {
    constructor(private readonly instrumentsService: InstrumentsService) { }

    @Post()
    @ApiOperation({ summary: 'Add a custom instrument (used when no catalog match exists)' })
    @ApiResponse({ status: 201, type: Instrument })
    create(@CurrentUser('id') userId: string, @Body() dto: CreateInstrumentDto) {
        return this.instrumentsService.create(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Search the instrument catalog (global + your custom instruments)' })
    findAll(
        @CurrentUser('id') userId: string,
        @Query(new ZodValidationPipe(InstrumentQuerySchema)) query: InstrumentQueryType,
    ) {
        return this.instrumentsService.findAll(userId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an instrument' })
    @ApiResponse({ status: 200, type: Instrument })
    findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.instrumentsService.findOne(userId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update your own custom instrument' })
    @ApiResponse({ status: 200, type: Instrument })
    update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateInstrumentDto) {
        return this.instrumentsService.update(userId, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete your own custom instrument (only if unused)' })
    remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.instrumentsService.remove(userId, id);
    }
}
