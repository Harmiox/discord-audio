import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
import { checkChannelPermissions } from '../../middlewares/validate-channel';
import { AppLogger } from '../../util/app-logger';

/**
 * List Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('ListCommand');

	 public constructor() {
		 super({
			desc: 'Shows you your saved playlist or another user\'s playlist if the mentioned user has one.',
			group: 'Music',
			guildOnly: true,
			name: 'list',
			usage: '<prefix>list'
		 });

		 // Attatch Middleware
		 this.use((message: Message, args: any[]) => checkChannelPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {

		return message.channel.send('Default response.');
	 }
 }