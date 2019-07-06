import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Resume Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('ResumeCommand');

	 public constructor() {
		 super({
			desc: 'Resume the music from being paused.',
			group: 'DJ',
			guildOnly: true,
			name: 'resume',
			usage: '<prefix>resume'
		 });

		 // Attatch Middleware
		this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		const guildQueue = this.client.queues.get(message.guild.id);
		if (!message.member.voiceChannel) { return message.channel.send('You have to be in the VoiceChannel to resume the music.'); }
		guildQueue.connection.dispatcher.resume();

		return message.reply('I\'ve resumed the music for you.');
	 }
 }