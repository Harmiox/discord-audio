import { Command, Message } from '@yamdbf/core';
import { VoiceConnection } from 'discord.js';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { IQueue } from '../../config/interfaces/music.interface';
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
		const voiceConnection: VoiceConnection = this.client.voice.connections.get(message.guild.id);
		
		try {
			this.client.queues.remove(message.guild.id);
			if (voiceConnection) { await voiceConnection.channel.leave(); }
		} catch (err) {
			this.logger.info('Error when leaving voice channel.', err);
			return message.reply('Error when trying to stop the music.' + `\`\`\`\n${err.message}\`\`\``);
		}

		return message.reply('way to ruin the party! I\'ve stopped the music for you.');
	}
 }