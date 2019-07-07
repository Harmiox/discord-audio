import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
import { IQueue } from '../../config/interfaces/music.interface';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Repeat Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('RepeatCommand');

	 public constructor() {
		super({
		desc: 'Toggle repeat for the queue.',
		group: 'DJ',
		guildOnly: true,
		name: 'repeat',
		usage: '<prefix>repeat'
		});

		 // Attatch Middleware
		this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		const guildQueue: IQueue = this.client.queues.get(message.guild.id);
		if (!guildQueue) { return message.reply('there doesn\'t seem to be an active queue.'); }
		if(!message.member.voice.channel) { return message.reply('you\'re not in a voice channel.'); }
		guildQueue.repeat = guildQueue.repeat === false ? true : false;

		return message.reply(`I've toggle repeat **${guildQueue.repeat}** for the queue.`);
	 }
 }