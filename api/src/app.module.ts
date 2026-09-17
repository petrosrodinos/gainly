import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailModule } from './modules/internal/mail/mail.module';
import { SmsModule } from './modules/internal/sms/sms.module';
import { AiModule } from './modules/internal/ai/ai.module';
import { RedisModule } from './core/databases/redis/redis.module';
import { RedisCacheModule } from './modules/internal/redis-cache/redis-cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule } from './shared/config/env/env.module';
import { QueuesModule } from './core/queues/queues.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { InstrumentsModule } from './modules/instruments/instruments.module';
import { MarketDataModule } from './modules/market-data/market-data.module';
import { MappingTemplatesModule } from './modules/mapping-templates/mapping-templates.module';
import { PositionsModule } from './modules/positions/positions.module';
import { CorporateActionsModule } from './modules/corporate-actions/corporate-actions.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ImportsModule } from './modules/imports/imports.module';
import { TaxEngineModule } from './modules/tax-engine/tax-engine.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule,
    MailModule,
    SmsModule,
    AiModule,
    RedisModule,
    RedisCacheModule,
    QueuesModule,
    // GraphQLModule,
    AuthModule,
    HealthModule,
    AuditLogModule,
    DocumentsModule,
    AccountsModule,
    InstrumentsModule,
    MarketDataModule,
    MappingTemplatesModule,
    PositionsModule,
    CorporateActionsModule,
    TransactionsModule,
    ImportsModule,
    TaxEngineModule,
    ReportsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
