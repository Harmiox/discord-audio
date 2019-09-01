import { Command, Message } from '@yamdbf/core';
import { TextChannel, VoiceChannel } from 'discord.js';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { IYouTubeSearch } from '../../config/interfaces/lavalink.interface';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Stream Command
 */

export default class extends Command<DiscordAudioClient> {
	private logger: AppLogger = new AppLogger('StreamCommand');

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
		this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this)); 
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
			// Search for the song
			const searchResults: IYouTubeSearch = await this.client.helper.query(`ytsearch:${args.join(' ')}`);
			const song = searchResults.tracks[0];
			if (!song) { return message.reply('unable to find song.'); }

			const newSong: IQueuedSong = {
				durationSeconds: song.info.length/1000,
				nickname: message.member.nickname,
				title: song.info.title,
				track: song.track,
				url: song.info.uri,
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
			if (!guildQueue.player) { return message.reply('I can\'t seem to find an active player.'); }
			guildQueue.songs.unshift(song);
			guildQueue.player.stop();
		} else {
			// Create the queue for the guild
			const newQueue: IQueue = {
				player: null,
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
		}

			/*
			// Play the song
			guildQueue.player.play(song.track);
			guildQueue.player.once('error', (err) => {
				this.logger.error(`LavaLink error trying to play a song: `, err);
				guildQueue.textChannel.send(`Dispatcher error: \`${err.message}\``);
				guildQueue.voiceChannel.leave();
				this.client.queues.remove(guild.id);
			});
			guildQueue.player.once('end', async (data: any) => {
				if (data.reason === "REPLACED") { return this.logger.info('REPLACED'); }
				this.play(message, guildQueue.songs[0]);
			});

			// Play the Live YouTube video
			try {
				const voiceConnection: VoiceConnection = await voiceChannel.join();
				const dispatcher = voiceConnection.play(ytdl(song.url, { filter: 'audioonly' }), { bitrate: 'auto' })
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
		*/
	}
}