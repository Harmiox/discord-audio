import { Command, Message } from '@yamdbf/core';
import { Guild, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
// @ts-ignore
import YouTube = require('simple-youtube-api');
import ytdl = require('ytdl-core');
import { StarkClient } from '../../client/stark-client';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { IScrapedYouTubeVideo, IYouTubePlaylist, IYouTubeVideo,  } from '../../config/interfaces/youtube-search.interface';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

// @ts-ignore
import Search = require('scrape-youtube');

/**
 * Replay Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('ReplayCommand');
	 private youtube: YouTube;

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

	 // Setup simple-youtube-api setup
	 public init(): void {
		this.youtube = new YouTube(this.client.config.youtube.apiKey);
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		const guildQueue: IQueue = this.client.queues.get(message.guild.id);
		if (!guildQueue) { return message.reply('there is currently no queue for this server.'); }
		guildQueue.songs.unshift(guildQueue.playing);

		return message.reply(`**${guildQueue.playing.title}** will replay (once) after it has finished playing.`);
	 }
 }