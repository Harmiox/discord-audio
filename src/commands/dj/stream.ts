import { Command, Message } from '@yamdbf/core';
import { VoiceChannel } from 'discord.js';
import LavaLink from 'discord.js-lavalink';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { IYouTubeSearch } from '../../config/interfaces/lavalink.interface';
import { IQueuedSong } from '../../config/interfaces/music.interface';
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
		const player: LavaLink.Player = await this.client.player.join({ 
			channel: message.member.voice.channel.id, 
			guild: message.guild.id, 
			host: this.client.player.nodes.first().host 
		}, { selfdeaf: true });
		if (!player) { return message.channel.send('I was unable initiate the player.'); }

		player.play(song.track);
		player.once('error', (err) => {
			this.logger.error(`LavaLink error trying to play a song: `, err);
			message.channel.send(`Dispatcher error: \`${err.message}\``);
			this.client.player.leave(message.guild.id);
		});
		player.once('end', async (data: any) => {
			if (data.reason === "REPLACED") { return this.logger.info('REPLACED'); }
			message.channel.send('Stream has finished.');
		});
	
		return message.channel.send(`Starting to stream **${song.title}** requested by **${message.author.username}** (${message.author.id})`);
	}
}