import { Command, Message } from '@yamdbf/core';
import { MessageEmbedThumbnail } from 'discord.js';
import { StarkClient } from '../../client/stark-client';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Stop Command
 */

 export default class extends Command<StarkClient> {
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
	const guildQueue = this.client.queues.get(message.guild.id);
	if (!message.member.voiceChannel) { return message.reply('you have to be in the VoiceChannel to stop the party.'); }
	if (!guildQueue.songs) { return message.reply(' there is nothing to stop.'); }
	guildQueue.songs = [];
	guildQueue.connection.dispatcher.end();

	return message.reply('way to ruin the party! I\'ve stopped the music for you.');
	}
 }