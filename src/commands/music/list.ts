import { Command, Message } from '@yamdbf/core';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { AppLogger } from '../../util/app-logger';

/**
 * List Command
 */

 export default class extends Command<DiscordAudioClient> {
	 private logger: AppLogger = new AppLogger('ListCommand');

	 public constructor() {
		 super({
			desc: 'Shows you your saved playlist or another user\'s playlist if the mentioned user has one.',
			group: 'Music',
			guildOnly: true,
			hidden: true, // < -- Remove When Finished
			name: 'list',
			usage: '<prefix>list'
		 });
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {

		return message.channel.send('Default response.');
	 }
 }