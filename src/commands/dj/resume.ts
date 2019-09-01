import { Command, Message } from '@yamdbf/core';
import { VoiceConnection } from 'discord.js';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { IQueue } from '../../config/interfaces/music.interface';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Resume Command
 */

 export default class extends Command<DiscordAudioClient> {
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
		const guildQueue: IQueue = this.client.queues.get(message.guild.id);
		if (!guildQueue) { return message.reply('there doesn\'t seem to be an active queue.'); }
		if(!message.member.voice.channel) { return message.reply('you\'re not in a voice channel.'); }
		guildQueue.player.resume();

		return message.reply('I\'ve resumed the music for you.');
	 }
 }