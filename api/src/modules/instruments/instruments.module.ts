import { Module } from '@nestjs/common';
import { PrismaModule } from '@/core/databases/prisma/prisma.module';
import { InstrumentsController } from './instruments.controller';
import { InstrumentsService } from './instruments.service';

@Module({
    imports: [PrismaModule],
    controllers: [InstrumentsController],
    providers: [InstrumentsService],
    exports: [InstrumentsService],
})
export class InstrumentsModule { }
