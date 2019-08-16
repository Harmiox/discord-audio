import { Command, Message } from '@yamdbf/core';
import { VoiceConnection } from 'discord.js';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Shuffle Command
 */

 export default class extends Command<DiscordAudioClient> {
	 private logger: AppLogger = new AppLogger('ShuffleCommand');

	 public constructor() {
		 super({
			desc: 'Shufle the queue.',
			group: 'DJ',
			guildOnly: true,
			name: 'shuffle',
			usage: '<prefix>shuffle'
		 });

		 // Attatch Middleware
		this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		const guildQueue: IQueue = this.client.queues.get(message.guild.id);
		const voiceConnection: VoiceConnection = this.client.voice.connections.get(message.guild.id);
		if (!guildQueue) { return message.reply('there doesn\'t seem to be an active queue.'); }
		if (guildQueue.songs.length === 0) { return message.reply('it seems the queue is empty.'); }
		if(!message.member.voice.channel) { return message.reply('you\'re not in a voice channel.'); }
		if (!voiceConnection) { return message.reply('I was unable to find a voice connection.'); }
		guildQueue.songs = this.shuffle(guildQueue.songs);

		return message.reply('I\'ve shuffled the music for you.');
	 }

	 private shuffle(queue: IQueuedSong[]): IQueuedSong[] {
		// tslint:disable-next-line
    var ctr = queue.length, temp, index;

    while (ctr > 0) {
        index = Math.floor(Math.random() * ctr);
        ctr--;
        temp = queue[ctr];
        queue[ctr] = queue[index];
        queue[index] = temp;
    }
    return queue;
}
 }