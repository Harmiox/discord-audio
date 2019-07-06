import { Command, Message } from '@yamdbf/core';
import { StarkClient } from '../../client/stark-client';
import { checkChannelPermissions } from '../../middlewares/validate-channel';
import { AppLogger } from '../../util/app-logger';

/**
 * Playlist Command
 */

 export default class extends Command<StarkClient> {
	 private logger: AppLogger = new AppLogger('PlaylistCommand');

	 public constructor() {
		 super({
			desc: 'Play your saved list or play a given YouTube playlist URL.',
			group: 'Music',
			guildOnly: true,
			name: 'playlist',
			usage: '<prefix>playlist (optional)https://www.youtube.com/watch?v=y83x7MgzWOA&list=PLMC9KNkIncKtGvr2kFRuXBVmBev6cAJ2u'
		 });

		 // Attatch Middleware
		 this.use((message: Message, args: any[]) => checkChannelPermissions(message, args, this));
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {

		return message.channel.send('Default response.');
	 }
 }