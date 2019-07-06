import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Skip Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('SkipCommand');

	 public constructor() {
		 super({
			desc: 'Skip the song that\'s currently playing',
			group: 'DJ',
			guildOnly: true,
			name: 'skip',
			usage: '<prefix>skip'
		 });

		 // Attatch Middleware
		this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		const serverQueue = this.client.queues.get(message.guild.id);
		if (!message.member.voiceChannel) { return message.channel.send('You have to be in a voice channel to stop the music!'); }
		if (!serverQueue) { return message.channel.send('There is currently nothing in the queue to skip.'); }
		console.log(serverQueue.connection.channel.name);
		serverQueue.connection.dispatcher.end();

		return message.reply('skipped.');
	 }
 }