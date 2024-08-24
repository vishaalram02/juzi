enum Class {
	Noun = 'noun',
	Pronoun = 'pronoun',
	Verb = 'verb',
	Adjective = 'adjective',
	Adverb = 'adverb',
	Preposition = 'preposition',
	Conjunction = 'conjunction',
	Quantifier = 'quantifier',
	Particle = 'particle'
}

export const classColors = {
	noun: 'bg-blue-300',
	pronoun: 'bg-purple-300',
	verb: 'bg-red-400',
	adjective: 'bg-green-300',
	adverb: 'bg-indigo-300',
	preposition: 'bg-pink-300',
	conjunction: 'bg-cyan-300',
	quantifier: 'bg-lime-300',
	particle: 'bg-yellow-300'
};

export interface Token {
	content: string;
	class: Class;
	translation: string;
	nodeIndex: number;
	pinyin: string;
}

export interface Node {
	index: number;
	translation: string;
	content: string;
	height: number;
	left: number;
	right: number;
}
