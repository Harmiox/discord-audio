import { TextChannel, VoiceChannel } from "discord.js";

export interface IQueue {
	playing: IQueuedSong;
	volume: number;
	songs: IQueuedSong[];
	voiceChannel: VoiceChannel;
	textChannel: TextChannel;
	repeat: boolean;
}

export interface IQueuedSong {
	title: string;
	url: string;
	userId: string;
	username: string;
	nickname?: string;
	playlist?: string;
	durationSeconds: number;
}

export interface IVote {
	count: 1;
	users: string[];
	guildId: string;
	start: number;
	textChannel: TextChannel;
	timeout: number | null;
}