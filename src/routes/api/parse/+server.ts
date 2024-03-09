import OpenAI from 'openai';
import { OPEN_API_KEY } from '$env/static/private';

const openai = new OpenAI({ apiKey: OPEN_API_KEY });
const PROMPT =
	'You are a Chinese language assistant helping me construct a Chinese grammar parse tree in JSON. ' +
	'I will provide you with a Chinese sentence and you will provide me with a JSON object representing the parse tree of the sentence. ' +
	'Each node of the tree will represent a grammatical component of the sentence and the leaf nodes will represent individual words. ' +
	'Each word at a leaf node should be standard words or idioms that I can find in a dictionary. ' +
	'You can ignore all punctuation in the output like commas, quotations, and periods. ' +
	"Each node will have a 'translation' field that contains the English translation of the component in the original context of the sentence. " +
	"There will also be a 'parse' field that contains a logical array of JSON objects representing largest grammatical subdivisions of the current component. " +
	'The root node will represent the entire sentence. ' +
	"The child nodes representing the indivdiual words will not contain a 'parse' field, but will instead contain a 'content' field representing the original Chinese word from the sentence, a 'class' field containing the part of speech of the word, a 'pinyin' field containing the pinyin pronounciation of the word with each syllable separated by a space, and a 'class' field containing the part of speech of the word. " +
  'The class field of each word should be one of the following: [noun, pronoun, verb, adjective, adverb, preposition, conjunction, quantifier, particle, other]. ' +
	'Make sure the nodes are processed in the same exact order as the words in the original sentence. ' +
	'Each character in the original Chinese sentence should be found in exactly one leaf node. ';

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

	return new Response(completions.choices[0].message.content);
};
