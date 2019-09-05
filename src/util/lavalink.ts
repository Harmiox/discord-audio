import axios from 'axios';
import LavaLink from 'discord.js-lavalink';
import { AppLogger } from './app-logger';

/**
 * 
 */

export class LavaLinkHelper {
	private logger: AppLogger = new AppLogger('LavaLinkHelper');
	private node: LavaLink.Node;

	constructor(node: LavaLink.Node) {
		this.node = node;
	}

	public query(query: string): any {
		return new Promise(async (resolve, reject) => {
			const res: any = await axios.get(
				`http://${this.node.host}:${this.node.port}/loadtracks?identifier=${query}`, 
				{ headers: { Authorization: this.node.password } })
					.catch(err => {
						this.logger.error('Failed to find song: ', err);
						reject(null);
					});

			if (!res || !res.data) { reject('Doesn\'t Exist!'); }
			// this.logger.info('Received Data: ', res.data);
			resolve(res.data);
		});
	}
}