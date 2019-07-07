export interface IYouTubePlaylist {
	id: string;
	title: string;
	description: string;
	thumbnails: IYouTubeThumbnails;
	getVideos(): Promise<IYouTubeVideo[]>;
}

export interface IYouTubeVideo {
	thumbnails: IYouTubeThumbnails;
	title: string;
	id: string;
	description: string;
	url: string;
	shortURL: string;
	durationSeconds: number;
}

export interface IYouTubeThumbnails {
	default: IYouTubeThumbnail;
	medium: IYouTubeThumbnail;
	high: IYouTubeThumbnail;
	standard: IYouTubeThumbnail;
	maxres: IYouTubeThumbnail;
}

export interface IYouTubeThumbnail {
	url: string;
	width: number;
	height: number;
}