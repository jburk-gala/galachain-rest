import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenService } from './token/token.service';
import { CredentialsService } from './credentials/credentials.service';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './S3Service';
import { ConfigService } from './config.service';
import { Startup } from './Startup';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    {
      provide: ConfigService,
      useValue: new ConfigService(
        `.env.${process.env.NODE_ENV || 'development'}`,
      ),
    },
    AppService,
    TokenService,
    S3Service,
    CredentialsService,
    Startup
  ],
})
export class AppModule {}
