import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',  // Allow all methods
    allowedHeaders: '*', // Allow all headers
  });
  await app.listen(3001);
}
bootstrap();
