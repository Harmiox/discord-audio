import { Client, Message } from '@yamdbf/core';
import { ConfigService } from '../config/config.service';
import { checkChannelPermissions } from '../middlewares/validate-channel';
import { AppLogger } from '../util/app-logger';
import { Queues } from '../util/queues';

import LavaLink from 'discord.js-lavalink';
import { LavaLinkHelper } from '../util/lavalink';

/**
 * DiscordAudio Client
 */

export class DiscordAudioClient extends Client {
	public queues: Queues = new Queues();
	public config: ConfigService;
	private logger: AppLogger = new AppLogger('DiscordAudioClient');
	private disconnects: number = 0;

	public player: LavaLink.PlayerManager;
	public helper: LavaLinkHelper;
	private nodes = [{ host: '173.212.245.60', port: 2333, password: 'youshallnotpass' }];

	constructor(config: ConfigService) {
		super({
			commandsDir: './dist/commands',
			owner: ['228781414986809344'], // Harmiox,
			pause: true,
			readyText: ' Client Ready',
			token: config.discord.token,
			unknownCommandError: false
		});

		this.config = config;

		this.use((message: Message, args: any[]) => checkChannelPermissions(message, args, this)); 

		// Bind events to local client methods
		this.on('ready', this.onReady);
		this.on('clientReady', this.onClientReady);
		this.on('warn', this.onWarn);
		this.on('pause', this.onPause);
		this.on('error', this.onError);
		this.on('disconnect', this.onDisconnect);
		this.on('reconnecting', this.onReconnecting);
	}

	public start() {
		this.logger.info(`${this.logger.context} has been started.`);

		return super.start();
	}

	private onClientReady() {
		this.player = new LavaLink.PlayerManager(this, this.nodes, {
			shards: (this.shard && this.shard.count) || 1,
			user: this.user.id
		});
		this.helper = new LavaLinkHelper(this.player.nodes.first());
	}

	private onReady() {
    this.logger.info(`${this.logger.context} is ready (${this.guilds.size} guilds)`);
	}

	private onWarn(info: {}): void {
    this.logger.warn('Discord warning: ', info);
  }

	private async onPause(): Promise<void> {
    await this.setDefaultSetting('prefix', '!');
    this.continue();
	}
	
	private onError(error: Error): void {
		this.logger.error('Client Error', error);
	}

	private onDisconnect(event: CloseEvent): void {
		this.logger.warn(`${this.logger.context} has been disconnected.`);
		this.disconnects += 1;
    this.logger.warn(`[DICONNECT:${event.code}] ${event.reason}`);
    if (event.code === 1000) {
			this.logger.warn('Disconnect with event code 1000. Exiting process...');
			process.exit();
    }
    if (this.disconnects >= 10) {
      this.logger.warn(`${this.disconnects} failed attempts on reconnecting. Exiting process...`);
    }
    this.logger.warn(`[ATTEMPT:${this.disconnects}] Attempting to login again...`);
    this.login(this.token).catch(err => {
			this.logger.info(`[ERROR] Error when attempting to login after disconnect.\n${err}`);
      process.exit();
    });
  }

  private onReconnecting(): void {
    this.logger.warn(`${this.logger.context} is reconnecting.`);
  }

}