import { Command, Message } from '@yamdbf/core';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { checkModPermissions } from '../../middlewares/validate-mod';
import { AppLogger } from '../../util/app-logger';

import LavaLink from 'discord.js-lavalink';
import { IYouTubeSearch } from '../../config/interfaces/lavalink.interface';

/**
 * Channel Command
 */

export default class extends Command<DiscordAudioClient> {
	private logger: AppLogger = new AppLogger('ChannelCommand');

	public constructor() {
		super({
			desc: 'Play a song via lavalink.',
			group: 'Moderation',
			guildOnly: true,
			name: 'lava',
			usage: '<prefix>lava Nonstop by Drake'
		});

		// Attatch Middleware
		this.use((message: Message, args: any[]) => checkModPermissions(message, args, this));
	}

	public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		if (!message.member || !message.member.voice.channel) {
			return message.reply('You must be in a voice channel for this command.');
		}

		// Search for the song
		const searchResults: IYouTubeSearch = await this.client.helper.query(`ytsearch:${args.join(' ')}`);
		const song = searchResults.tracks[0];
		if (!song) { return message.reply('unable to find song.'); }

		// Create the player
		const player: LavaLink.Player = await this.client.player.join({ 
			channel: message.member.voice.channel.id, 
			guild: message.guild.id, 
			host: this.client.player.nodes.first().host 
		}, { selfdeaf: true });
		if (!player) { return message.reply('unable not join.'); }

		// Play the song
		player.play(song.track);
		player.once("error", this.logger.error);
		player.once("end", async (data: any) => {
			if (data.reason === "REPLACED") { return; }
			message.channel.send("Song has ended...");
			await this.client.player.leave(message.guild.id);
		});

		return message.reply(`Now playing: **${song.info.title}** by *${song.info.author}*`);
	}
}