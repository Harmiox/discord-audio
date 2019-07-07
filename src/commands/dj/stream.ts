import { Command, Message } from '@yamdbf/core';
import { Guild, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
// @ts-ignore
import YouTube = require('simple-youtube-api');
import ytdl = require('ytdl-core');
import { StarkClient } from '../../client/stark-client';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { IYouTubePlaylist, IYouTubeVideo } from '../../config/interfaces/youtube-search.interface';
import { checkChannelPermissions } from '../../middlewares/validate-channel';
import { AppLogger } from '../../util/app-logger';

/**
 * Stream Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('StreamCommand');
	 private youtube: YouTube;

	 public constructor() {
		 super({
			desc: 'Stream a YouTube livestream.',
			group: 'Music',
			guildOnly: true,
			name: 'stream',
			ratelimit: '1/5s',
			usage: '<prefix>stream https://www.youtube.com/watch?v=OlP_FYgSEtM',
		 });

		 // Attatch Middleware
		 this.use((message: Message, args: any[]) => checkChannelPermissions(message, args, this)); 
	 }

	 // Setup simple-youtube-api setup
	 public init(): void {
		this.youtube = new YouTube(this.client.config.youtube.apiKey);
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		// Check if the user gave a URL for a video or playlist.
		const url: string = args[0];
		if (!url) { return message.reply('you didn\'t give me a link to a live YouTube video to play.'); }
		const youTubeRegEx: RegExp = new RegExp(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/g);
		if (!youTubeRegEx.test(args[0])) { return message.reply('I can only stream Live YouTube videos.'); }

		// User must be in a VoiceChannel
		const voiceChannel: VoiceChannel = message.member.voice.channel;
		if (!voiceChannel) { return message.reply("you must be in a voice channel."); }

		// Make sure the bot has permission to join and speak in a VoiceChannel
		const permissions = voiceChannel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			return message.reply('I permission to join and speak in your voice channel.');
		}
		
		try {
			const video: IYouTubeVideo = await this.youtube.getVideo(url);
			if (!video) { return message.reply('I wasn\'t able to load that song. Please make sure the link is correct.'); }
			const newSong: IQueuedSong = {
				durationSeconds: video.durationSeconds,
				nickname: message.member.nickname,
				title: video.title,
				url: video.url,
				userId: message.author.id,
				username: message.author.username
			};
			
			return this.stream(message, newSong, voiceChannel);
		} catch (err) {
			this.logger.error('An error occurred while trying to get YouTube video details', err);

			return message.reply('An error occurred:\n' + `\`\`\`\n${err.message}\`\`\``);
		}
	 }

	 /**
		 * Start streaming
		 */
	 private async stream(message: Message, song: IQueuedSong, voiceChannel: VoiceChannel): Promise<Message | Message[]> {
		const guild = message.guild;
		const guildQueue = this.client.queues.get(guild.id);

		if (guildQueue) { 
			guildQueue.songs.unshift(song);
			const voiceConnection: VoiceConnection = this.client.voice.connections.get(guild.id);
			if (!voiceConnection) { return message.reply('I can\'t seem to find a voice connection to strema to.'); }
			voiceConnection.dispatcher.end();
		} else {
			// Create the queue for the guild
			const newQueue: IQueue = {
				playing: null,
				repeat: false,
				songs: [],
				textChannel: message.channel as TextChannel,
				voiceChannel,
				volume: 5
			};
			this.client.queues.set(guild.id, newQueue);

			// Add the live video to the queue to be streamed
			newQueue.songs.push(song);

			// Play the Live YouTube video
			try {
				const voiceConnection: VoiceConnection = await voiceChannel.join();
				const dispatcher = voiceConnection.play(ytdl(song.url))
					.on('start', () => {
						guildQueue.playing = guildQueue.songs[0];
						guildQueue.songs.shift();
					})
					.on('end', () => {
						guildQueue.voiceChannel.leave();
						this.client.queues.remove(guild.id);
					})
					.on('error', (err: Error) => {
						this.logger.error('Dispatcher error when trying to stream a Live YouTube video.', err);
					});
				dispatcher.setVolumeLogarithmic(guildQueue.volume / 5);
			} catch (err) {
				this.logger.error('An error has occurred when trying to stream a Live YouTube video.', err);
				this.client.queues.remove(guild.id);

				return message.channel.send(`An error has occurred: \`${err.message}\``);
			}
		}

		return message.channel.send(`Starting to stream **${song.title}** requested by **${message.author.username}** (${message.author.id})`);
	 }
 }