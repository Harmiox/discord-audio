import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
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
			hidden: true, // < -- Remove When Finished
			name: 'save',
			usage: '<prefix>save'
		 });
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {

		return message.channel.send('Default response.');
	 }
 }