import { TextChannel, VoiceChannel, VoiceConnection } from "discord.js";

export interface IQueue {
	playing: IQueuedSong;
	volume: number;
	connection: VoiceConnection;
	songs: IQueuedSong[];
	voiceChannel: VoiceChannel;
	textChannel: TextChannel;
}

export interface IQueuedSong {
	title: string;
	url: string;
	userId: string;
	username: string;
	nickname?: string;
}
