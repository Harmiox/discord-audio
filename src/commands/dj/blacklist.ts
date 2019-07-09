import { Command, Message } from '@yamdbf/core';
import { VoiceConnection } from 'discord.js';
import { StarkClient } from '../../client/stark-client';
import { IQueue } from '../../config/interfaces/music.interface';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Blacklist Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('BlacklistCommand');

	 public constructor() {
		 super({
			desc: 'Blacklist',
			group: 'DJ',
			guildOnly: true,
			name: 'blacklist',
			usage: '<prefix>blacklist'
		 });

		 // Attatch Middleware
		this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {

		return message.reply('I\'ve paused the music for you.');
	 }
 }