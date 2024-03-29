import { Command, Message } from '@yamdbf/core';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { AppLogger } from '../../util/app-logger';

/**
 * Queue Command
 */

 export default class extends Command<DiscordAudioClient> {
	 private logger: AppLogger = new AppLogger('QueueCommand');

	 public constructor() {
		 super({
			aliases: [ 'q' ],
			desc: 'Get a list of the current songs in queue.',
			group: 'Music',
			guildOnly: true,
			name: 'queue',
			usage: '<prefix>queue 5(amount of queue to get)'
		 });
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		 const guildQueue: IQueue = this.client.queues.get(message.guild.id);
		 if (!guildQueue) { return message.channel.send('There doesn\'t seeem to be anything in the queue.'); }
		 const playing: IQueuedSong = guildQueue.playing;
		 if (!playing) { return message.channel.send('I don\'t seem to be playing anything at the moment.'); }
		 const max: number = args[0] ? parseInt(args[0], null) : guildQueue.songs.length < 5 ? guildQueue.songs.length : 5;
		 const response: string = playing ? `Currently playing **${playing.title}** requested by **${playing.username}**(${playing.userId}).` : '';
		 const songs: string = guildQueue.songs.map((s, i) => `${i+1}. ${s.title}`).filter((s, i) => i < max && i < 15).join('\n');
		 const code: string = `\`\`\`css\n${songs.length > 0 ? `[ - Showing the next ${max}/${guildQueue.songs.length} songs in the queue. - ]\n` + songs : '# Nothing is currently in the queue.'}\`\`\``;

		return message.channel.send(response + code);
	 }
 }