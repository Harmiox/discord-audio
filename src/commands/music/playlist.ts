import { Command, Message } from '@yamdbf/core';
import { DiscordAudioClient } from '../../client/discord-audio-client';
import { AppLogger } from '../../util/app-logger';

/**
 * Playlist Command
 */

 export default class extends Command<DiscordAudioClient> {
	 private logger: AppLogger = new AppLogger('PlaylistCommand');

	 public constructor() {
		 super({
			desc: 'Play your saved list or play a given YouTube playlist URL.',
			group: 'Music',
			guildOnly: true,
			hidden: true, // < -- Remove When Finished
			name: 'playlist',
			usage: '<prefix>playlist (optional)https://www.youtube.com/watch?v=y83x7MgzWOA&list=PLMC9KNkIncKtGvr2kFRuXBVmBev6cAJ2u'
		 });
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {

		return message.channel.send('Default response.');
	 }
 }