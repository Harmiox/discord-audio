import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Purge Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('PurgeCommand');

	 public constructor() {
		 super({
			desc: 'Purge all the songs currently in queue.',
			group: 'DJ',
			guildOnly: true,
			name: 'purge',
			usage: '<prefix>purge'
		 });

		 // Attatch Middleware
		this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		 this.client.queues.remove(message.guild.id);

		return message.reply('the queue has been purged.');
	 }
 }