import { Command, Message } from '@yamdbf/core';
import { User } from 'discord.js';
import { StarkClient } from '../../client/stark-client';
import { IQueue, IQueuedSong } from '../../config/interfaces/music.interface';
import { checkDjPermissions } from '../../middlewares/validate-dj';
import { AppLogger } from '../../util/app-logger';

/**
 * Remove Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('RemoveCommand');

	 public constructor() {
		 super({
			aliases: [ 'r' ],
			desc: 'Remove a specific song from the queue.',
			group: 'DJ',
			guildOnly: true,
			name: 'remove',
			usage: '<prefix>remove <song name | user | playlist>'
		 });

		 // Attatch Middleware
		this.use((message: Message, args: any[]) => checkDjPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		// Check is argument was given
		if (!args[0] && !message.mentions.users.first()) { 
			return message.reply("you must give me a song name, @user or user id, or 'playlist' to remove a song/songs from the queue.");
		}

		// Resolve argument(s)
		const userIdRegex: RegExp = new RegExp(/(\d{17,19})/g);
		const mentionedUser: User = message.mentions.users.first();
		const userId: string = mentionedUser ? mentionedUser.id : userIdRegex.test(args[0]) ? args[0] : null;
		const index: number = parseInt(args[0], 10);
		const playlist: boolean = args[0] ? args[0].toLocaleLowerCase() === 'playlist' : false;

		// Get the queue for this server
		const guildQueue: IQueue = this.client.queues.get(message.guild.id);
		if (!guildQueue) { return message.reply('there doesn\'t seem to be an active queue.'); }
		if (guildQueue.songs.length === 0) { return message.reply('it seems the queue is empty.'); }

		// Find the song(s) to remove from the queue
		const removedSongs: IQueuedSong[] = [];
		for (let i = guildQueue.songs.length - 1; i >= 0; i--) {
			const song: IQueuedSong = guildQueue.songs[i];
			let removeIndex: number = -1;

			if (userId) {
				// Remove all songs given by a User
				if (song.userId === userId) { removeIndex = i; }
			} else if (playlist) {
				// Remove all songs from a playlist
				if (song.playlist) { removeIndex = i; }
			} else if (index >= 0) {
				// Remove a song from the given index
				if ((index - 1) === i) { removeIndex = i; }
			} else {
				// Remove all songs that have a matching title
				const search: string = args.join(' ');
				if (song.title.toLocaleLowerCase().indexOf(search) >= 0) { removeIndex = i; }
			}

			if (removeIndex >= 0) { removedSongs.push(guildQueue.songs.splice(i, 1)[0]); }
		}

		// No songs were removed from the queue
		if (removedSongs.length === 0) { return message.reply('I was unable to remove anything from the queue.'); }
		
		// Songs were removed from the queue
		if (removedSongs.length > 1) {
			return message.reply(`I've removed **${removedSongs.length}** songs from the queue.`);
		} else {
			return message.reply(`I've removed **${removedSongs[0].title}** from the queue.`);
		}
	 }
 }