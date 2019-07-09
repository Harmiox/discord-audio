import { Command, Message } from '@yamdbf/core';
import { Guild, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
// @ts-ignore
import YouTube = require('simple-youtube-api');
import ytdl = require('ytdl-core');
import { StarkClient } from '../../client/stark-client';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { IYouTubePlaylist, IYouTubeVideo, IScrapedYouTubeVideo } from '../../config/interfaces/youtube-search.interface';
import { checkChannelPermissions } from '../../middlewares/validate-channel';
import { AppLogger } from '../../util/app-logger';

// @ts-ignore
import Search = require('scrape-youtube');

/**
 * Play Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('PlayCommand');
	 private youtube: YouTube;

	 public constructor() {
		 super({
			aliases: [ 'p' ],
			desc: 'Start playing music!',
			group: 'Music',
			guildOnly: true,
			name: 'play',
			ratelimit: '1/5s',
			usage: '<prefix>play Harder to Breathe by Maroon 5',
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
		let url: string;
		const song: string = args.join(' ');
		const list: string[] = song.match(/[?&]list=([^#\&\?]+)/i);
		const youTubeRegEx: RegExp = new RegExp(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/g);
		if (youTubeRegEx.test(args[0])) { url = args[0]; }

		// User must be in a VoiceChannel
		const voiceChannel: VoiceChannel = message.member.voice.channel;
		if (!voiceChannel) { return message.reply("you must be in a voice channel to play music."); }

		// Make sure the bot has permission to join and speak in a VoiceChannel
		const permissions = voiceChannel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			return message.channel.send('I need the permissions to join and speak in your voice channel!');
		}
		
		// Add song(s) to the queue
		if (list) {
			// Youtube Playlist was given
			return this.handlePlaylist(message, url, voiceChannel);
		} else if (url) {
			// Handle Youtube video URL
			return this.handleYouTubeVideoURL(message, url, voiceChannel);
		} else {
			// Search for song on YouTube
			return this.handleSearch(message, song, voiceChannel);
		}
	 }

	 private async handleSoundCloud(message: Message): Promise<Message | Message[]> {
		 return message.reply('Coming Soon.');
	 }

	 /**
		 * Put a YouTube playlist into the queue to be played.
		 */
	 private async handlePlaylist(message: Message, url: string, voiceChannel: VoiceChannel): Promise<Message | Message[]> {
		try {
			const playlist: IYouTubePlaylist = await this.youtube.getPlaylist(url);
			const videos: IYouTubeVideo[] = await playlist.getVideos();
			for (const video of videos) {
				const newSong: IQueuedSong = {
					durationSeconds: video.durationSeconds,
					nickname: message.member.nickname,
					playlist: playlist.title,
					title: video.title,
					url: video.url,
					userId: message.author.id,
					username: message.author.username
				};
				
				if (newSong.durationSeconds <= 600) {
					await this.addToQueue(message, newSong, voiceChannel);
				}
			}

			return message.reply(`I've put your playlist **${playlist.title}** into the queue, starting off with **${videos[0].title}**.`);
		} catch (err) {
			this.logger.error('Error occured when adding a playlist to the queue', err);

			return message.reply(
				'An error occurred when trying to add your playlist to the queue:'
				+ `\`\`\`\n${err.message}\`\`\``);
		}
	 }

		/**
		 * Play song from YouTube video URL
		 */
	 private async handleYouTubeVideoURL(message: Message, url: string, voiceChannel: VoiceChannel): Promise<Message | Message[]> {
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

			if (video.durationSeconds > 600) { return message.reply('you can\'t play videos longer than 10 minutes.'); }
			if (video.durationSeconds === 0) { return message.reply('you can only play live YouTube videos with the stream command.')}
			await this.addToQueue(message, newSong, voiceChannel);

			return message.reply(`I've put **${newSong.title}** into the queue.`);
		} catch (err) {
			this.logger.error('Error occured when playing from video URL', err);

			return message.reply(
				'An error occurred when trying to add your video to the queue:'
				+ `\`\`\`\n${err.message}\`\`\``);
		}
	 }

		/**
		 * Search for the YouTube video to play.
		 */
	 private async handleSearch(message: Message, song: string, voiceChannel: VoiceChannel): Promise<Message | Message[]> {
		try {
			// Webscrape YouTube for the song.
			const searchResults: IScrapedYouTubeVideo[] = await Search(song, { limit: 1, type: 'audio' });
			if (!searchResults || !searchResults[0]) { return message.reply('I wasn\'t able to find that song.'); }
			const video: IScrapedYouTubeVideo = searchResults[0];

			// Song was found
			const newSong: IQueuedSong = {
				durationSeconds: video.duration,
				nickname: message.member.nickname,
				title: video.title,
				url: video.link,
				userId: message.author.id,
				username: message.author.username
			};

			if (newSong.durationSeconds > 600) { return message.reply('you can\'t play videos longer than 10 minutes.'); }
			if (newSong.durationSeconds === 0) { return message.reply('you can only play live YouTube videos with the stream command.')}
			await this.addToQueue(message, newSong, voiceChannel);

			return message.reply(`I've put **${newSong.title}** into the queue.`);
		} catch (err) {
			this.logger.error('Error when searching for song', err);

			return message.reply(
				'An error occurred when searching for your song:'
				+  `\`\`\`\n${err.message}\`\`\``);
		}
	 }

	 /**
		 * Add a song at the end of the queue.
		 */
	 private async addToQueue(message: Message, song: IQueuedSong, voiceChannel: VoiceChannel): Promise<Message | Message[]> {
		const guild = message.guild;
		const guildQueue = this.client.queues.get(guild.id);

		if (guildQueue) { 
			guildQueue.songs.push(song);
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

			// Add the song to the queue to be played
			newQueue.songs.push(song);

			// Play the song
			try {
				const connection: VoiceConnection = await voiceChannel.join();
				this.play(message, newQueue.songs[0]);
			} catch (err) {
				this.logger.error('An error has occurred when trying to add a song to the queue/play it..', err);
				this.client.queues.remove(guild.id);

				return message.channel.send('An error has occurred:' +  `\`\`\`\n${err.message}\`\`\``);
			}
		}
	 }

	 /**
		 * Play the next song in the queue.
		 */
	 private play(message: Message, song: IQueuedSong): void {
		const guild: Guild = message.guild;
		const guildQueue: IQueue = this.client.queues.get(guild.id);
	
		if (!song || !song.url) {
			guildQueue.voiceChannel.leave();
			this.client.queues.remove(guild.id);

			return;
		}

		this.client.queues.play(guild.id, song);
		const voiceConnection: VoiceConnection = this.client.voice.connections.get(guild.id);
		const dispatcher = voiceConnection.play(ytdl(song.url, { filter: 'audioonly' }), { bitrate: 'auto' })
			.on('start', () => {
				// this.logger.info('Dispatcher started.');
				guildQueue.playing = guildQueue.songs[0];
				if (guildQueue.repeat) { guildQueue.songs.push(guildQueue.songs.shift()); }
				else { guildQueue.songs.shift(); }
			})
			.on('end', () => {
				// this.logger.info('Dispatcher ended.');
				this.play(message, guildQueue.songs[0]);
			})
			.on('error', (err: Error) => {
				// console.log(song);
				// this.logger.info('Dispatcher error, calling play() function.');
				this.logger.error(`Dispatcher error trying to play a song: `, err);
				this.play(message, guildQueue.songs[0]);
			});
		dispatcher.setVolumeLogarithmic(guildQueue.volume / 5);
	}
 }