import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { checkChannelPermissions } from '../../middlewares/validate-channel';
import { AppLogger } from '../../util/app-logger';

/**
 * Queue Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('QueueCommand');

	 public constructor() {
		 super({
			desc: 'Get a list of the current songs in queue.',
			group: 'Music',
			guildOnly: true,
			name: 'queue',
			usage: '<prefix>queue 5(amount of queue to get)'
		 });

		 // Attatch Middleware
		 this.use((message: Message, args: any[]) => checkChannelPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		 const queue: IQueue = this.client.queues.get(message.guild.id);
		 if (!queue) { return message.channel.send('There doesn\'t seeem to be anything in the queue.'); }
		 const playing: IQueuedSong = queue.playing;
		 if (!playing) { return message.channel.send('I don\'t seem to be playing anything at the moment.'); }
		 const max: number = args[0] ? parseInt(args[0], null) : queue.songs.length < 5 ? queue.songs.length : 5;
		 const response: string = playing ? `Currently playing **${playing.title}** requested by **${playing.username}**(${playing.userId}).` : '';
		 const songs: string = queue.songs.map((s, i) => `${i+1}. ${s.title}`).filter((s, i) => i < max && i < 15).join('\n');
		 const code: string = `\`\`\`css\n${songs.length > 0 ? `[ - Showing the next ${max}/${queue.songs.length} songs in the queue. - ]\n` + songs : '# Nothing is currently in the queue.'}\`\`\``;

		return message.channel.send(response + code);
	 }
 }