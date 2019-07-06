import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
import { checkChannelPermissions } from '../../middlewares/validate-channel';
import { AppLogger } from '../../util/app-logger';

/**
 * Save Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('SaveCommand');

	 public constructor() {
		 super({
			desc: 'Save the Currently Playing song to your list.',
			group: 'Music',
			guildOnly: true,
			name: 'save',
			usage: '<prefix>save'
		 });

		 // Attatch Middleware
		 this.use((message: Message, args: any[]) => checkChannelPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {

		return message.channel.send('Default response.');
	 }
 }