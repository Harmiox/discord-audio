import { Command, Message } from '@yamdbf/core';
import { TextChannel } from 'discord.js';
import { StarkClient } from '../../client/stark-client';
import { checkModPermissions } from '../../middlewares/validate-mod';
import { AppLogger } from '../../util/app-logger';

/**
 * Channel Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('ChannelCommand');

	 public constructor() {
		 super({
			desc: 'Restrict which channel commands can be used in your guild.',
			group: 'Moderation',
			guildOnly: true,
			name: 'channel',
			usage: '<prefix>channel #music'
		 });

		 // Attatch Middleware
		this.use((message: Message, args: any[]) => checkModPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		const channel: TextChannel = message.mentions.channels.first();
		if (!channel) { return message.reply('please mention the channel you want to restrict commands to.'); }
		message.guild.storage.set('channelId', channel.id);

		return message.reply(`I've restricted commands to ${channel}.`);
	 }
 }