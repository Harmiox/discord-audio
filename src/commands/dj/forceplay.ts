import { Command, Guild, Message } from '@yamdbf/core';
import { TextChannel, VoiceChannel } from 'discord.js';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { IYouTubeSearch } from '../../config/interfaces/lavalink.interface';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * ForcePlay Command
 */
export default class extends Command<DiscordAudioClient> {
	private logger: AppLogger = new AppLogger('ForcePlayCommand');

	public constructor() {
		super({
		aliases: [ 'fp' ],
		desc: 'Play a song. Skips the queue if there is one.',
		group: 'DJ',
		guildOnly: true,
		name: 'forceplay',
		ratelimit: '1/5s',
		usage: '<prefix>forceplay Harder to Breathe by Maroon 5',
		});

		// Attatch Middleware
		this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this));
	}

	/**
	 * 
	 * @param message 
	 * @param args 
	 */
	public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		// User must be in a VoiceChannel
		const voiceChannel: VoiceChannel = message.member.voice.channel;
		if (!voiceChannel) { return message.reply("you must be in a voice channel to play music."); }

		// Make sure the bot has permission to join and speak in a VoiceChannel
		const permissions = voiceChannel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			return message.channel.send('I need the permissions to join and speak in your voice channel!');
		}

		// Search for the song
		const searchResults: IYouTubeSearch = await this.client.helper.query(`ytsearch:${args.join(' ')}`);
		const song = searchResults.tracks[0];
		if (!song) { return message.reply('unable to find song.'); }

		// Play the song
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

			// Put the song to the front of the queue.
			guildQueue.songs.unshift(song);
			// End the current song.
			guildQueue.player.stop();

			return message.reply(`starting to play **${song.title}**.`);
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
			guildQueue.voiceChannel.leave();
			this.client.queues.remove(guild.id);

			return; // TODO: [OPTION] Leave when the last song in the queue is over.
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
			if (data.reason === "REPLACED") { return this.logger.info('REPLACED'); }
			this.play(message, guildQueue.songs[0]);
		});
	}
}