import { Command, Guild, Message } from '@yamdbf/core';
import { StreamOptions, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
// @ts-ignore
import WebSearch = require('scrape-youtube');
// @ts-ignore
import YouTube = require('simple-youtube-api');
import ytdl = require('ytdl-core-discord');
import { StarkClient } from '../../client/stark-client';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { IYouTubePlaylist, IYouTubeVideo } from '../../config/interfaces/youtube-search.interface';
import { AppLogger } from '../../util/app-logger';

import Cheerio from 'cheerio';
import Request from 'request-promise';

/**
 * Play Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('PlayCommand');
	 private youtubeApi: YouTube;

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
	 }

	 // Setup simple-youtube-api setup
	 public init(): void {
		this.youtubeApi = new YouTube(this.client.config.youtube.apiKey);
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
			return message.reply('you cannot use this command to play playlists.');
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
			const playlist: IYouTubePlaylist = await this.youtubeApi.getPlaylist(url);
			const videos: IYouTubeVideo[] = await playlist.getVideos();
			const maxDuration: number = (await message.guild.storage.get('maxDurationSeconds')) || 600;
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
				
				if (newSong.durationSeconds <= maxDuration) {
					return this.addToQueue(message, newSong, voiceChannel);
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
		this.youtubeApi.getVideo(url)
			.then(async (video: IYouTubeVideo) => {
				const newSong: IQueuedSong = {
					durationSeconds: video.durationSeconds,
					nickname: message.member.nickname,
					title: video.title,
					url: video.url,
					userId: message.author.id,
					username: message.author.username
				};
	
				const maxDuration: number = (await message.guild.storage.get('maxDurationSeconds')) || 600;
				if (video.durationSeconds > maxDuration) { return message.reply('you can\'t play videos longer than 10 minutes.'); }
				if (video.durationSeconds === 0) { return message.reply('you can only play live YouTube videos with the stream command.')}
				
				this.addToQueue(message, newSong, voiceChannel);
			})
			.catch((err: Error) => {
				this.logger.error('Error occured when playing from video URL', err);

				return message.reply(
					'An error occurred when trying to add your video to the queue:'
					+ `\`\`\`\n${err.message}\`\`\``);
			});

		return message;
	 }

		/**
		 * Search for the YouTube video to play. (Webscrape due to low quota given from Google)
		 */
	 private async handleSearch(message: Message, song: string, voiceChannel: VoiceChannel): Promise<Message | Message[]> {
		const requestUrl: string = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(song);
		Request(requestUrl)
			.then(async (responseHtml: string) => {
				const html: CheerioStatic = Cheerio.load(responseHtml);
				const video: Cheerio = html('div#content li .yt-lockup').eq(0);
				const href: string = video.find('a').eq(0).attr('href');
				const durationString: string = video.find('span .video-time').text();
				const splitDuration: string[] = durationString.split(':'); 
				const videoDuration: number = (+splitDuration[0]) * 60 + (+splitDuration[1]); 
				const videoTitle: string = video.find('.yt-lockup-title').children('a').text();
				const videoUrl: string = href ? `https://www.youtube.com${href}` : null;
				if (!videoUrl) { return message.reply('Failed to find URL for that song.'); }

				const newSong: IQueuedSong = {
					durationSeconds: videoDuration,
					nickname: message.member.nickname,
					title: videoTitle,
					url: videoUrl,
					userId: message.author.id,
					username: message.author.username
				};

				const maxDuration: number = (await message.guild.storage.get('maxDurationSeconds')) || 600;
				if (newSong.durationSeconds > maxDuration) { return message.reply('you can\'t play videos longer than 10 minutes.'); }
				if (newSong.durationSeconds === 0) { return message.reply('you can only play live YouTube videos with the stream command.'); }

				this.addToQueue(message, newSong, voiceChannel);
			})
			.catch((err) => {
				this.logger.error('Error when searching for song', err);

				return message.reply(
					'An error occurred when searching for your song:'
					+  `\`\`\`\n${err.message}\`\`\``);
			});
		
		return message;
	 }

	 /**
		 * Add a song at the end of the queue.
		 */
	 private async addToQueue(message: Message, song: IQueuedSong, voiceChannel: VoiceChannel): Promise<Message | Message[]> {
		const guild = message.guild;
		const guildQueue = this.client.queues.get(guild.id);

		if (guildQueue) {
			// Make sure the song is not already in the queue
			for (const queuedSong of guildQueue.songs) {
				if (queuedSong.url === song.url) { return message.reply('that song is already in the queue.'); }
			}

			// Validate that the user can add the song to the queue
			const maxQueueLength: number = (await guild.storage.get('maxQueueLength'));
			const maxSongsPerUser: number = (await guild.storage.get('maxSongsPerUser'));
			if (maxQueueLength > 0 && guildQueue.songs.length >= maxQueueLength) { return message.reply(`the queue is full. **(max: ${maxQueueLength})**`); }
			if (maxSongsPerUser > 0) {
				let count: number = 0;
				guildQueue.songs.forEach((queuedSong: IQueuedSong) => { if (queuedSong.userId === message.author.id) { count += 1; } });
				if (count >= maxSongsPerUser) { return message.reply(`you can only have up to **${maxSongsPerUser}** songs in the queue.`); }
			} 
			guildQueue.songs.push(song);

			return message.reply(`I've added **${song.title}** to the queue.`);
		} else {
			// Create the queue for the guild
			const newQueue: IQueue = {
				playing: null,
				repeat: false,
				songs: [],
				textChannel: message.channel as TextChannel,
				voiceChannel,
				volume: (await guild.storage.get('defaultVolume')) || 1
			};
			this.client.queues.set(guild.id, newQueue);

			// Add the song to the queue to be played
			newQueue.songs.push(song);

			// Play the song
			try {
				const connection: VoiceConnection = await voiceChannel.join();
				const songToPlay: IQueuedSong = newQueue.songs[0];
				this.play(message, songToPlay);

				return message.reply(`starting to play **${songToPlay.title}**.`);
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
	 private async play(message: Message, song: IQueuedSong): Promise<void> {
		const guild: Guild = message.guild;
		const guildQueue: IQueue = this.client.queues.get(guild.id);
	
		if (!song || !song.url) {
			guildQueue.voiceChannel.leave();
			this.client.queues.remove(guild.id);

			return;
		}

		this.logger.info(`Playing: ${song.url}`);

		this.client.queues.play(guild.id, song);
		const voiceConnection: VoiceConnection = this.client.voice.connections.get(guild.id);
		const ytdlOptions: {} = { filter: 'audioonly' };
		const streamOptions: StreamOptions = { bitrate: 'auto', passes: 2, type: 'opus' };
		const dispatcher = voiceConnection.play(await ytdl(song.url), streamOptions)
			.on('start', async () => {
				// this.logger.info('Dispatcher started.');
				guildQueue.playing = guildQueue.songs[0];
				if (guildQueue.repeat) { guildQueue.songs.push(guildQueue.songs.shift()); }
				else { guildQueue.songs.shift(); }

				const announce: boolean = await guild.storage.get('announceSongs');
				const currPlaying: IQueuedSong = guildQueue.playing;
				if (announce) { 
					guildQueue.textChannel.send(
						`Starting to play **${currPlaying.title}** requested by **${currPlaying.username}** (${currPlaying.userId})`); 
				}
			})
			.on('end', () => {
				// this.logger.info('Dispatcher ended.');
				this.play(message, guildQueue.songs[0]);
			})
			.on('error', (err: Error) => {
				this.logger.error(`Dispatcher error trying to play a song: `, err);
				guildQueue.textChannel.send(`Dispatcher error: \`${err.message}\``);
				guildQueue.voiceChannel.leave();
				this.client.queues.remove(guild.id);
				// this.play(message, guildQueue.songs[0]);
			});
		dispatcher.setVolume(guildQueue.volume);
	}
 }