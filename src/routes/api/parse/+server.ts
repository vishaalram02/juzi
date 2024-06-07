import OpenAI from 'openai';
import { OPEN_API_KEY } from '$env/static/private';

const openai = new OpenAI({ apiKey: OPEN_API_KEY });
const PROMPT =
	'You are a Chinese language assistant helping me construct a Chinese grammar parse tree in JSON. ' +
	'I will provide you with a Chinese sentence and you will provide me with a JSON object representing the parse tree of the sentence. ' +
	"If I don't provide a Chinese sentence, you should return {'error': 'input should be a chinese sentence'}" +
	'You must parse every single word in the sentence in the exact order that it is given. ' +
	'Each node of the tree will represent a grammatical component of the sentence and the leaf nodes will represent individual words. The root node represents the entire sentence. ' +
	'Each word at a leaf node should be standard words or idioms that I can find in a dictionary. ' +
	"Every node will have a 'translation' field that contains the English translation of the component in the original context of the sentence. " +
	"Every node that is not a leaf node will have a 'parse' field that contains a logical array of JSON objects representing largest grammatical subdivisions of the current component. " +
	"The leaf nodes representing the indivdiual will not contain a parse field and will instead contain additional fields: a 'content' field with the original Chinese word from the sentence, a 'class' field containing the part of speech of the word in the original context of the chinese sentence, and a 'pinyin' field containing the pinyin pronounciation of the word with each syllable separated by a space. " +
	'If the word is punctuation, the pinyin should just be the word itself. ' +
	'The class field of each word should be one of the following: [noun, pronoun, verb, adjective, adverb, preposition, conjunction, quantifier, particle, punctuation]. ' +
	'Make sure the nodes are processed in the same exact order as the words in the original sentence and that every node has a translation field, including the leaf nodes. ' +
	'Do not skip or change the order of any words. Include every character in the parse tree. This is very important. ';

const collapse = (node: any): any => {
	while (node.parse && node.parse.length === 1) {
		node = node.parse[0];
	}
	if (!node.parse) return node;
	node.parse = node.parse.map(collapse);
	return node;
};

export const POST = async ({ request }) => {
	const { input } = await request.json();

	if (!input) {
		return new Response(JSON.stringify({ error: 'no input provided :(' }), { status: 400 });
	}

	if (input.length > 50) {
		return new Response(JSON.stringify({ error: "please keep input under 50 characters :')" }), {
			status: 400
		});
	}

	const completions = await openai.chat.completions.create({
		messages: [
			{
				role: 'system',
				content: PROMPT
			},
			{ role: 'user', content: input }
		],
		model: 'gpt-4o',
		response_format: { type: 'json_object' }
	});

	if (!completions.choices[0].message || !completions.choices[0].message.content) {
		return new Response('Error parsing', { status: 400 });
	}

	const res = JSON.parse(completions.choices[0].message.content);
	if (res.error) {
		return new Response(JSON.stringify(res), { status: 400 });
	}

	const tree = JSON.stringify(collapse(res));
	return new Response(tree);
};
