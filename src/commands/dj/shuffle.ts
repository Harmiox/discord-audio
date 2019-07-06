import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
import { IQueuedSong } from '../../config/interfaces/music.interface';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Shuffle Command
 */

 export default class extends Command<StarkClient> {
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
		const guildQueue = this.client.queues.get(message.guild.id);
		if (!message.member.voiceChannel) { return message.channel.send('You have to be in the VoiceChannel to shuffle the music.'); }
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