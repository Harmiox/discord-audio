import { Command, Guild, Message } from '@yamdbf/core';
import { TextChannel, VoiceChannel } from 'discord.js';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { IYouTubeSearch } from '../../config/interfaces/lavalink.interface';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { AppLogger } from '../../util/app-logger';

/**
 * Play Command
 */

export default class extends Command<DiscordAudioClient> {
	private logger: AppLogger = new AppLogger('PlayCommand');

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

	/**
	 * 
	 * @param message 
	 * @param args 
	 */
	public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		// Search for the song
		const searchResults: IYouTubeSearch = await this.client.helper.query(`ytsearch:${args.join(' ')}`);
		const song = searchResults.tracks[0];
		if (!song) { return message.reply('unable to find song.'); }

		// User must be in a VoiceChannel
		const voiceChannel: VoiceChannel = message.member.voice.channel;
		if (!voiceChannel) { return message.reply("you must be in a voice channel to play music."); }

		// Make sure the bot has permission to join and speak in a VoiceChannel
		const permissions = voiceChannel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			return message.channel.send('I need the permissions to join and speak in your voice channel!');
		}
		
		const newSong: IQueuedSong = {
			durationSeconds: Math.floor(song.info.length/1000),
			nickname: message.member.nickname,
			title: song.info.title,
			track: song.track,
			url: song.info.uri,
			userId: message.author.id,
			username: message.author.username
		};

		const maxDuration: number = (await message.guild.storage.get('maxDurationSeconds')) || 600;
		if (newSong.durationSeconds > maxDuration) { return message.reply('you can\'t play videos longer than 10 minutes.'); }
		if (newSong.durationSeconds === 0) { return message.reply('you can only play live YouTube videos with the stream command.'); }

		return this.addToQueue(message, newSong, voiceChannel);
	}

	/**
	 * 
	 * @param message 
	 * @param song 
	 * @param voiceChannel 
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
				player: null,
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
	 * 
	 * @param message 
	 * @param song 
	 */
	private async play(message: Message, song: IQueuedSong): Promise<any> {
		const guild: Guild = message.guild;
		const guildQueue: IQueue = this.client.queues.get(guild.id);

		// Make sure there is a song in the queue.
		if (!song || !song.url) {
			this.client.queues.remove(guild.id);
			this.client.player.leave(guild.id);

			return;
		}

		// Make sure there is a player.
		if (!guildQueue.player) {
			guildQueue.player = await this.client.player.join({ 
				channel: message.member.voice.channel.id, 
				guild: message.guild.id, 
				host: this.client.player.nodes.first().host 
			}, { selfdeaf: true });
			if (!guildQueue.player) { return guildQueue.textChannel.send('I was unable initiate the player.'); }
		}

		// Playing now
		this.logger.info(`Playing: ${song.url}`);
		this.client.queues.play(guild.id, song);

		// Update the queue
		guildQueue.playing = guildQueue.songs[0];
		if (guildQueue.repeat) { guildQueue.songs.push(guildQueue.songs.shift()); }
		else { guildQueue.songs.shift(); }

		// Announce the currently playing song.
		const announce: boolean = await guild.storage.get('announceSongs');
		const currPlaying: IQueuedSong = guildQueue.playing;
		if (announce) { 
			guildQueue.textChannel.send(
				`Starting to play **${currPlaying.title}** requested by **${currPlaying.username}** (${currPlaying.userId})`); 
		}

		// Play the song
		guildQueue.player.play(song.track);
		guildQueue.player.once('error', (err) => {
			this.logger.error(`LavaLink error trying to play a song: `, err);
			guildQueue.textChannel.send(`Dispatcher error: \`${err.message}\``);
			guildQueue.voiceChannel.leave();
			this.client.queues.remove(guild.id);
		});
		guildQueue.player.once('end', async (data: any) => {
			this.logger.info(`ENDED: ${data.reason}`);
			if (data.reason === "REPLACED") { return this.logger.info('REPLACED'); }
			this.play(message, guildQueue.songs[0]);
		});
	}
}