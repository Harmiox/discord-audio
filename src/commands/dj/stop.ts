import { Command, Message } from '@yamdbf/core';
import LavaLink from 'discord.js-lavalink';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Stop Command
 */

 export default class extends Command<DiscordAudioClient> {
	private logger: AppLogger = new AppLogger('StopCommand');

	public constructor() {
		super({
		desc: 'Disconnects from the VoiceChannel and deletes the Queue & Currently Playing.',
		group: 'DJ',
		guildOnly: true,
		name: 'stop',
		usage: '<prefix>stop'
		});

		// Attatch Middleware
		this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this));
	}

	public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		const player = this.client.player.find((p: LavaLink.Player) => p.id === message.guild.id);
		const guildQueue = this.client.queues.get(message.guild.id);
		if (!player) { return message.reply('Nothing to stop.'); }
		if (guildQueue) { this.client.queues.remove(message.guild.id); }
		
		this.client.player.leave(message.guild.id);

		return message.reply('way to ruin the party! I\'m stopping the music for you.');
	}
 }