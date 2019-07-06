import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Pause Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('PauseCommand');

	 public constructor() {
		 super({
			desc: 'Pause the music.',
			group: 'DJ',
			guildOnly: true,
			name: 'pause',
			usage: '<prefix>pause'
		 });

		 // Attatch Middleware
		this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		const guildQueue = this.client.queues.get(message.guild.id);
		if (!message.member.voiceChannel) { return message.channel.send('You have to be in the VoiceChannel to pause the music.'); }
		guildQueue.connection.dispatcher.pause();

		return message.reply('I\'ve paused the music for you.');
	 }
 }