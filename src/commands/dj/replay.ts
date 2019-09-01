import { Command, Message } from '@yamdbf/core';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { IQueue } from '../../config/interfaces/music.interface';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Replay Command
 */

 export default class extends Command<DiscordAudioClient> {
	 private logger: AppLogger = new AppLogger('ReplayCommand');

	 public constructor() {
		 super({
			aliases: [ 'rp' ],
			desc: 'Will replay the currently playing song once it ends.',
			group: 'DJ',
			guildOnly: true,
			name: 'replay',
			ratelimit: '1/5s',
			usage: '<prefix>replay',
		 });

		 // Attatch Middleware
		 this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this));
	 }
	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		const guildQueue: IQueue = this.client.queues.get(message.guild.id);
		if (!guildQueue) { return message.reply('there is currently no queue for this server.'); }
		guildQueue.songs.unshift(guildQueue.playing);

		return message.reply(`**${guildQueue.playing.title}** will replay (once) after it has finished playing.`);
	 }
 }