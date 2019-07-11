const ReqPromise = require('request-promise');
const Cheerio = require('cheerio');

const song = 'one thing right';
const requestUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(song);
console.log(requestUrl);

ReqPromise(requestUrl)
	.then((responseHtml) => {
		const html = Cheerio.load(responseHtml);

		const video = html('div#content li .yt-lockup').eq(0);
		const href = video.find('a').eq(0).attr('href');
		const url = `https://www.youtube.com${href}`;
		const durationString = video.find('span .video-time').text();
		const splitDuration = durationString.split(':'); 
		const durationSeconds = (+splitDuration[0]) * 60 + (+splitDuration[1]); 
		const title = video.find('.yt-lockup-title').children('a').text();

		const song = { url, durationSeconds, title }

		console.log(song);
	})
	.catch((err) => console.log(err));