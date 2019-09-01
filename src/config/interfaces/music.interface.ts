import { TextChannel, VoiceChannel } from "discord.js";
import LavaLink from 'discord.js-lavalink';

export interface IQueue {
	playing: IQueuedSong;
	player: LavaLink.Player;
	volume: number;
	songs: IQueuedSong[];
	voiceChannel: VoiceChannel;
	textChannel: TextChannel;
	repeat: boolean;
}

export interface IQueuedSong {
	title: string;
	track: string;
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
	durationSeconds: number;
}