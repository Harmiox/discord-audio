import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { checkChannelPermissions } from '../../middlewares/validate-channel';
import { AppLogger } from '../../util/app-logger';

/**
 * NowPlaying Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('PlaylistCommand');

	 public constructor() {
		 super({
			aliases: ['now'],
			desc: 'Play your saved list or play a given YouTube playlist URL.',
			group: 'Music',
			guildOnly: true,
			name: 'nowplaying',
			usage: '<prefix>nowplaying'
		 });

		 // Attatch Middleware
		 this.use((message: Message, args: any[]) => checkChannelPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		 const queue: IQueue = this.client.queues.get(message.guild.id);
		 if (!queue) { return message.reply('I don\'t seem to have anything in the queue to play right now.'); }
		 const song: IQueuedSong = queue.playing;
		 if (!song) { return message.reply('I don\'t seem to be playing anything right now.'); }

		return message.channel.send(`Currently playing **${song.title}** requested by **${song.username}**(${song.userId})\n${song.url}`);
	 }
 }