import { Command, Message } from '@yamdbf/core';
import { GuildMember } from 'discord.js';

export async function checkDjPermissions(
  message: Message,
  args: any[],
	command: Command
// @ts-ignore
): Promise<[Message, any[]]> {
	if (message.guild) {
		const member: GuildMember = message.member || await message.guild.members.fetch(message.author.id);
		const modeRoleId: string = await message.guild.storage.get('modRoleId');
		const djRoleId: string = await message.guild.storage.get('djRoleId');
		// Has DJ Role or Mod Role
		if (member.roles.has(djRoleId) || member.roles.has(modeRoleId)) { return [message, args]; }
		// Is an Owner
		if (command.client.owner.indexOf(message.author.id) >= 0) { return [message, args]; }
	}
}
