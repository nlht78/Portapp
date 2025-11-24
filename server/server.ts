import { app } from './src/app';
import { mongodbInstance } from './src/db/init.mongodb';
import { AIResearchService } from './src/api/services/ai-research.service';

const PORT = process.env.PORT || process.env.NODE_PORT || 8080;

const server = app.listen(PORT, async () => {
  await mongodbInstance.connect();
  
  // Initialize AI Research Service with provider manager
  AIResearchService.initialize();
  
  console.log(process.env.NODE_ENV, 'hello world from port', PORT);
});

process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));
process.on('uncaughtException', (e) => {
  console.error('UncaughtException: ', e);
});

async function cleanup(sig: string) {
  console.log(`Received kill signal: ${sig}, shutting down gracefully`);
  await mongodbInstance.disconnect();
  await server.close(() => {
    console.log('Closed out remaining connections');
  });
  process.exit(0);
}
