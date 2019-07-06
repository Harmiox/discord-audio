import { IQueue, IQueuedSong } from "../config/interfaces/music.interface";

export class Queues {
	private queues: Map<string, IQueue> = new Map();

	public set(guildId: string, queue: IQueue): void {
		this.queues.set(guildId, queue);
	}

	public get(guildId: string): IQueue {
		return this.queues.get(guildId);
	}

	public remove(guildId: string): void {
		this.queues.delete(guildId);
	}

	public play(guildId: string, song: IQueuedSong): void {
		const guildQueue: IQueue = this.queues.get(guildId);
		guildQueue.playing = song;
	}

}