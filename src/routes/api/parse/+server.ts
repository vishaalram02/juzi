import OpenAI from 'openai';
import { OPEN_API_KEY } from '$env/static/private';

const openai = new OpenAI({ apiKey: OPEN_API_KEY });
const PROMPT =
	'You are a Chinese language assistant helping me construct a Chinese grammar parse tree in JSON. ' +
	'I will provide you with a Chinese sentence and you will provide me with a JSON object representing the parse tree of the sentence. ' +
	'Each node of the tree will represent a grammatical component of the sentence and the leaf nodes will represent individual words. The root node represents the entire sentence. ' +
	'Each word at a leaf node should be standard words or idioms that I can find in a dictionary. ' +
	'You can ignore all punctuation in the output like commas, quotations, and periods. Do not include them in the parse tree. ' +
	"Every node will have a 'translation' field that contains the English translation of the component in the original context of the sentence. " +
	"Every node that is not a leaf node will have a 'parse' field that contains a logical array of JSON objects representing largest grammatical subdivisions of the current component. " +
	"The leaf nodes representing the indivdiual will not contain a parse field and will instead contain additional fields: a 'content' field with the original Chinese word from the sentence, a 'class' field containing the part of speech of the word in the original context of the chinese sentence, and a 'pinyin' field containing the pinyin pronounciation of the word with each syllable separated by a space. " +
	'The class field of each word should be one of the following: [noun, pronoun, verb, adjective, adverb, preposition, conjunction, quantifier, particle, other]. ' +
	'Make sure the nodes are processed in the same exact order as the words in the original sentence and that every node has a translation field. ' +
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

	const completions = await openai.chat.completions.create({
		messages: [
			{
				role: 'system',
				content: PROMPT
			},
			{ role: 'user', content: input }
		],
		model: 'gpt-4-0125-preview',
		response_format: { type: 'json_object' }
	});

	if (!completions.choices[0].message || !completions.choices[0].message.content) {
		return new Response('Error parsing', { status: 400 });
	}

	const tree = JSON.stringify(collapse(JSON.parse(completions.choices[0].message.content)));
	return new Response(tree);
};
