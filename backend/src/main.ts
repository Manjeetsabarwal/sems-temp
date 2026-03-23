import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:5173', 
      'http://localhost:3001', 
      'http://127.0.0.1:5173',
      /^http:\/\/127\.0\.0\.1:\d+$/, // Allow any port from 127.0.0.1 (Windsurf browser preview)
      /^http:\/\/localhost:\d+$/ // Allow any port from localhost
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 School Exam Management API is running on: http://localhost:${port}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   🔐 Authentication:`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - GET  /api/auth/me`);
  console.log(`   📊 Data Endpoints:`);
  console.log(`   - GET  /api/academic-years`);
  console.log(`   - GET  /api/classes`);
  console.log(`   - GET  /api/sections`);
  console.log(`   - GET  /api/teachers`);
  console.log(`   - GET  /api/students`);
  console.log(`   - GET  /api/subjects`);
  console.log(`   - GET  /api/exams`);
  console.log(`   - GET  /api/marks`);
  console.log(`   - GET  /api/results`);
  console.log(`   - GET  /api/results/report-cards`);
  console.log(`   - GET  /api/results/report-card/:studentId/:examId`);
  console.log(`\n💡 Demo Credentials: See DEMO_CREDENTIALS.md`);
}

bootstrap();
