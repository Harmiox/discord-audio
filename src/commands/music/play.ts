import { Command, Message } from '@yamdbf/core';
import { Guild, RichEmbed, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
// @ts-ignore
import YouTube = require('simple-youtube-api');
import ytdl = require('ytdl-core');
import { StarkClient } from '../../client/stark-client';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { IYouTubePlaylist, IYouTubeVideo } from '../../config/interfaces/youtube-search.interface';
import { checkChannelPermissions } from '../../middlewares/validate-channel';
import { AppLogger } from '../../util/app-logger';

/**
 * Play Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('PlayCommand');
	 private youtube: YouTube;

	 public constructor() {
		 super({
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
		const voiceChannel: VoiceChannel = message.member.voiceChannel;
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

	 /**
		 * Put a YouTube playlist into the queue to be played.
		 */
	 private async handlePlaylist(message: Message, url: string, voiceChannel: VoiceChannel): Promise<Message | Message[]> {
		const playlist: IYouTubePlaylist = await this.youtube.getPlaylist(url);
		const videos: IYouTubeVideo[] = await playlist.getVideos();
		for (const video of videos) {
			const newSong: IQueuedSong = {
				nickname: message.member.nickname,
				title: video.title,
				url: video.url,
				userId: message.author.id,
				username: message.author.username
			};

			await this.addToQueue(message, newSong, voiceChannel);
		}

		return message.reply(`I've put your playlist **${playlist.title}** into the queue, starting off with **${videos[0].title}**.`);
	 }

		/**
		 * Play song from YouTube video URL
		 */
	 private async handleYouTubeVideoURL(message: Message, url: string, voiceChannel: VoiceChannel): Promise<Message | Message[]> {
		const video: IYouTubeVideo = await this.youtube.getVideo(url);
		if (!video) { return message.reply('I wasn\'t able to load that song. Please make sure the link is correct.'); }
		const newSong: IQueuedSong = {
			nickname: message.member.nickname,
			title: video.title,
			url: video.url,
			userId: message.author.id,
			username: message.author.username
		};
		await this.addToQueue(message, newSong, voiceChannel);

		return message.reply(`I've put **${newSong.title}** into the queue.`);
	 }

		/**
		 * Search for the YouTube video to play.
		 */
	 private async handleSearch(message: Message, song: string, voiceChannel: VoiceChannel): Promise<Message | Message[]> {
		const videos: IYouTubeVideo[] = await this.youtube.searchVideos(song, 1);
		if (!videos) { return message.reply('I wasn\'t able to find that song. Perhaps give me a YouTube video link?'); }
		const newSong: IQueuedSong = {
			nickname: message.member.nickname,
			title: videos[0].title,
			url: videos[0].url,
			userId: message.author.id,
			username: message.author.username
		};
		await this.addToQueue(message, newSong, voiceChannel);
			
		return message.reply(`I've put **${newSong.title}** into the queue.`);
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
			console.log('new queue');
			// Create the queue for the guild
			const newQueue: IQueue = {
				connection: null,
				playing: null,
				songs: [],
				textChannel: message.channel as TextChannel,
				voiceChannel,
				volume: 5,
			};
			this.client.queues.set(guild.id, newQueue);

			// Add the song to the queue to be played
			newQueue.songs.push(song);

			// Play the song
			try {
				const connection: VoiceConnection = await voiceChannel.join();
				newQueue.connection = connection;
				this.play(message, newQueue.songs[0]);
			} catch (err) {
				this.logger.error('An error has occurred when trying to play a song.', err);
				this.client.queues.remove(guild.id);

				return message.channel.send(`An error has occurred: \`${err.message}\``);
			}
		}
	 }

	 /**
		 * Play the next song in the queue.
		 */
	 private play(message: Message, song: IQueuedSong): void {
		console.log('play()');
		const guild: Guild = message.guild;
		const guildQueue: IQueue = this.client.queues.get(guild.id);
	
		if (!song) {
			guildQueue.voiceChannel.leave();
			this.client.queues.remove(guild.id);

			return;
		}

		this.client.queues.play(guild.id, song);
		console.log(`playing ${song.title}...`);
		const dispatcher = guildQueue.connection.playStream(ytdl(song.url))
			.on('start', () => {
				console.log('dispatcher started');
				guildQueue.playing = guildQueue.songs[0];
				guildQueue.songs.shift();
			})
			.on('end', () => {
				console.log('dispatcher ended');
				this.play(message, guildQueue.songs[0]);
			})
			.on('error', (err: Error) => {
				console.log('dispatcher error');
				this.logger.error('Dispatcher error when trying to play a song.', err);
				this.play(message, guildQueue.songs[0]);
			});
		dispatcher.setVolumeLogarithmic(guildQueue.volume / 5);
	}
 }