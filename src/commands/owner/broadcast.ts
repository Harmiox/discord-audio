import { Command, Message } from '@yamdbf/core';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Broadcast Command
 */

 export default class extends Command<DiscordAudioClient> {
	 private logger: AppLogger = new AppLogger('BroadcastCommand');

	 public constructor() {
		 super({
			desc: 'Broadcast to every server.',
			group: 'Owner',
			guildOnly: true,
			hidden: true, // <--- Remove when finished.
			name: 'broadcast',
			usage: '<prefix>broadcast'
		 });

		 // Attatch Middleware
		this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {

		return message.reply('I\'ve paused the music for you.');
	 }
 }