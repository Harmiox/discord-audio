import { Command, Message, Middleware, ResourceLoader } from '@yamdbf/core';
import { using } from '@yamdbf/core/bin/command/CommandDecorators';
import { TextChannel } from 'discord.js';
import { StarkClient } from '../../client/stark-client';
import { checkModPermissions } from '../../middlewares/validate-mod';
import { AppLogger } from '../../util/app-logger';

/**
 * Set Command
 */

export default class extends Command<StarkClient> {
	private logger: AppLogger = new AppLogger('SetCommand');

	public constructor() {
		super({
		desc: 'Set guild settings',
		group: 'Moderation',
		guildOnly: true,
		name: 'set',
		usage: `<prefix>set <option> <value> ['global']` 
		});

		// Attatch Middleware
	this.use((message: Message, args: any[]) => checkModPermissions(message, args, this));
	}

	@using(Middleware.resolve('option: String, value: String'))
	@using(Middleware.expect(
		`option: [`
		+ `'maxVolume',`
		+ `'defaultVolume',`
		+ `'announceSongs',`
		+ `'maxDurationSeconds',`
		+ `'maxSongsPerUser',`
		+ `'maxQueueLength',`
		+ `'voteToSkipThreshold',`
		+ `'voteToSkipDurationSeconds'`
		+ `], value: String`))
	public async action(message: Message, [option, value]: [string, string]): Promise<Message | Message[]> {
		try {
			let resolvedValue: any;

			switch (option) {
				case 'maxVolume': 
					const maxVolume: number = parseFloat(value);
					if (!maxVolume || maxVolume <= 0 || maxVolume > 2) { return message.reply(`the **${option}** can only be set to a **min of 0** and a **max of 2**.`);}
					resolvedValue = maxVolume;
					await message.guild.storage.set(option, resolvedValue);				
					break;
				case 'defaultVolume':
					const defaultVolume: number = parseFloat(value);
					if (!defaultVolume || defaultVolume <= 0 || defaultVolume > 2) { return message.reply(`the **${option}** can only be set to a **min of 0** and a **max of 2**.`);}
					resolvedValue = defaultVolume;
					await message.guild.storage.set(option, resolvedValue);
					break;
				case 'announceSongs':
					resolvedValue = (value.toLocaleLowerCase() === 'true');
					await message.guild.storage.set(option, resolvedValue);
					break;
				case 'maxDurationSeconds':
					resolvedValue = parseInt(value, 10);
					if (!resolvedValue || resolvedValue <= 0) { return message.reply(`the **${option}** can only be set above 0.`); }
					await message.guild.storage.set(option, resolvedValue);
					break;
				case 'maxSongsPerUser':
					resolvedValue = parseInt(value, 10);
					if (!resolvedValue || resolvedValue <= 0) { return message.reply(`the **${option}** can only be set above 0.`); }
 					await message.guild.storage.set(option, resolvedValue);
					break;
				case 'maxQueueLength':
					resolvedValue = parseInt(value, 10);
					if (!resolvedValue || resolvedValue <= 0) { return message.reply(`the **${option}** can only be set above 0.`); }
					await message.guild.storage.set(option, resolvedValue);
					break;
				case 'voteToSkipThreshold':
					const skipThreshold: number = parseFloat(value);
					if (!skipThreshold || skipThreshold < 0 || skipThreshold > 1) { return message.reply('you can only give a value equal or between **0.00** and **1.00**'); }
					resolvedValue = skipThreshold;
					await message.guild.storage.set(option, resolvedValue);
					break;
				case 'voteToSkipDurationSeconds':
					const seconds: number = parseInt(value, 10);
					if (!seconds || seconds <= 0) { return message.reply('you can only give a a time longer than **0** seconds.'); }
					resolvedValue = seconds;
					await message.guild.storage.set(option, resolvedValue);
					break;
				default:
					return message.reply('it appears something went wrong. (given option is not internally supported)');
			}
	
			return message.reply(`I've set this server's option **${option}** to **${resolvedValue}**.`);
		} catch (err) {
			this.logger.error(err);

			return message.reply(`Error:\`\`\`\n${err.message}\`\`\``);
		}
		
	}
}