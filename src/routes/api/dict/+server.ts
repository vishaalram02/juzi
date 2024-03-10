import { kv } from '@vercel/kv';
import dotenv from 'dotenv';

dotenv.config();

interface Entry {
	english: string;
	pinyin: string;
}

interface Dict {
	[key: string]: Entry[];
}

export const POST = async ({ request }) => {
	const { tokens } = await request.json();

	let res: Dict = {};
	if (!tokens) return new Response(JSON.stringify({ res: res }), { status: 400 });

	for (let i = 0; i < tokens.length; i++) {
		const list: Entry[] = [];
		const input = tokens[i];
		let cnt = 0;
		while (true) {
			const english: string | null = await kv.hget(input + ':' + cnt.toString(), 'english');
			const pinyin: string | null = await kv.hget(input + ':' + cnt.toString(), 'pinyin');
			if (!english || !pinyin) break;
			list.push({ english, pinyin });
			cnt++;
		}
		res[input] = list;
	}

	return new Response(JSON.stringify(res), { status: 200 });
};
