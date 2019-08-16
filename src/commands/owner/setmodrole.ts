import { Command, Message } from '@yamdbf/core';
import { Role } from 'discord.js';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { AppLogger } from '../../util/app-logger';

/**
 * SetModRole Command
 */

 export default class extends Command<DiscordAudioClient> {
	 private logger: AppLogger = new AppLogger('SetModRoleCommand');

	 public constructor() {
		 super({
			desc: 'Set which role can use Moderation commands.',
			group: 'Owner',
			guildOnly: true,
			name: 'setmodrole',
			ownerOnly: true,
			usage: '<prefix>setmodrole'
		 });
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		const roleId: string = args[0].match(/!?(\d{17,19})/g)[0];
		if (!roleId) { return message.reply('please give a valid Role ID.'); }
		const role: Role = message.guild.roles.get(args[0]);
		if (!role) { return message.reply('that role was not found. Please give a valid Role ID from this guild.'); } 
 		message.guild.storage.set('modRoleId', role.id);

		return message.reply(`I've set **${message.guild.name}'s** Mod role to **${role.name}**(${role.id})`);
	 }
 }