import { StarkClient } from './client/stark-client';
import { ConfigService } from './config/config.service';
import { AppLogger} from './util/app-logger';

const logger: AppLogger = new AppLogger('Main');
const config: ConfigService = new ConfigService();

async function bootstrap(): Promise<void> {
	logger.info('Initiating Stark Client');
	logger.info(`${Date.now()}`);

	const client: StarkClient = new StarkClient(config);
  client.start();
}

process.on("unhandledRejection", error => {
	logger.error("Unhandled promise rejection:", error);
});

bootstrap();