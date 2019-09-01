export interface IYouTubeSearch {
	playlistInfo: any;
	loadType: "SEARCH_RESULT";
	tracks:  ITracks[];
	level: string;
	message: string;
	label: string;
	timestamp: string;
}

export interface ITracks {
	track: string;
	info: ITrackInfo;
}

export interface ITrackInfo {
	identifier: string;
	isSeekable: boolean;
	author: string;
	length: number;
	isStream: boolean;
	position: number;
	title: string;
	uri: string;
}
