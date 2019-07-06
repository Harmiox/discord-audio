import { Command, Message } from '@yamdbf/core';
import { GuildMember } from 'discord.js';

export async function checkModPermissions(
  message: Message,
  args: any[],
  command: Command
// @ts-ignore
): Promise<[Message, any[]]> {
	if (message.guild) {
		const member: GuildMember = message.member || await message.guild.fetchMember(message.author.id);
		const requiredRoleId: string = await message.guild.storage.get('modRoleId');
		// Has Mod Role
		if (member.roles.has(requiredRoleId)) { return [message, args]; }
		// Is an Owner
		if (command.client.owner.indexOf(message.author.id) >= 0) { return [message, args]; }
	}
}
