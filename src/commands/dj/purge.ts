import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
import { IQueue } from '../../config/interfaces/music.interface';
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
		const guildQueue: IQueue = this.client.queues.get(message.guild.id);
		if (!guildQueue) { return message.reply('there doesn\'t seem to be an active queue.'); }
		guildQueue.songs = [];

		return message.reply('the queue has been purged.');
	 }
 }