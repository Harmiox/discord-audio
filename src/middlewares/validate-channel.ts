import { Command, Message } from '@yamdbf/core';
import { GuildMember } from 'discord.js';

export async function checkChannelPermissions(
  message: Message,
  args: any[],
  command: Command
// @ts-ignore
): Promise<[Message, any[]]> {
	if (message.guild) {
		const member: GuildMember = message.member || await message.guild.fetchMember(message.author.id);
		const modeRoleId: string = await message.guild.storage.get('modRoleId');
		const djRoleId: string = await message.guild.storage.get('djRoleId');
		const requiredChannelId: string = await message.guild.storage.get('channelId');
		// Isn't restricted to a single channel
		if (!requiredChannelId) { return [message, args]; }
		// Is in allowed channel
		if (message.channel.id === requiredChannelId) { return [message, args]; }
		// Has DJ Role or Mod Role
		if (member.roles.has(djRoleId) || member.roles.has(modeRoleId)) { return [message, args]; }
		// Is an Owner
		if (command.client.owner.indexOf(message.author.id) >= 0) { return [message, args]; }
	}
}
