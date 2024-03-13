<script lang="ts">
	import examples from '../data/examples.json';
	import Info from '../lib/components/info.svelte';

	const classColors = {
		noun: 'bg-blue-300',
		pronoun: 'bg-purple-300',
		verb: 'bg-red-400',
		adjective: 'bg-green-300',
		adverb: 'bg-indigo-300',
		preposition: 'bg-pink-300',
		conjunction: 'bg-cyan-300',
		quantifier: 'bg-lime-300',
		particle: 'bg-yellow-300',
		other: 'bg-gray-300'
	};

	enum Class {
		Noun = 'noun',
		Pronoun = 'pronoun',
		Verb = 'verb',
		Adjective = 'adjective',
		Adverb = 'adverb',
		Preposition = 'preposition',
		Conjunction = 'conjunction',
		Quantifier = 'quantifier',
		Particle = 'particle',
		Other = 'other'
	}

	interface Token {
		content: string;
		class: Class;
		translation: string;
		nodeIndex: number;
		pinyin: string;
	}

	interface Node {
		index: number;
		translation: string;
		content: string;
		height: number;
		left: number;
		right: number;
	}

	let showPinyin = true;
	let showInfo = false;
	let inputValue = '';
	let parse: any = {};
	let dict: any = {};
	let status = 0;
	let tokens: Token[] = [];
	let levels: number[][] = [];
	let nodes: Node[] = [];
	let selected = 0;
	let hover = -1;
	let hoverToken = -1;
	let tokenNum = -1;
	let definition = 0;
	let example = 0;
	let maxHeight = 0;
	let error = 'Oops something went wrong!';

	const getExample = () => {
		let rand;
		do {
			rand = Math.floor(Math.random() * examples.parse.length);
		} while (rand == example);

		example = rand;
		parse = examples.parse[rand];
		dict = examples.dict[rand];
		getData();
		status = 3;
	};

	$: setTokenNum(selected);
	const setTokenNum = (index: number) => {
		definition = 0;
		for (let i = 0; i < tokens.length; i++) {
			if (tokens[i].nodeIndex == index) {
				tokenNum = i;
				return;
			}
		}
		tokenNum = -1;
	};

	const searchDict = () => {
		fetch('/api/dict', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ tokens: tokens.map((value) => value.content) })
		})
			.then((res) => res.json())
			.then((data) => {
				dict = data;
			});
	};

	const getData = () => {
		(tokens = []), (nodes = []), (levels = []);
		selected = 0;
		maxHeight = calc(parse).height;
		for (let i = 0; i <= maxHeight; i++) {
			levels.push([]);
			level(parse, i);
		}
	};

	const submit = () => {
		status = 1;
		fetch('/api/parse', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ input: inputValue })
		})
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				if (data.error) {
					status = 2;
					error = data.error;
					return;
				}

				parse = data;
				getData();
				searchDict();
				status = 3;
			});
	};

	const calc = (node: any): { height: number; left: number; right: number; content: string } => {
		let res = { height: 0, left: 0, right: 0, content: '' };
		let height = 0;
		let left = tokens.length;
		let right = 0;
		let content = '';
		let index = nodes.length;
		node.index = nodes.length;
		nodes.push({
			index,
			translation: node.translation,
			height,
			left,
			right,
			content
		});
		if (!node.parse) {
			tokens.push({ ...node, nodeIndex: nodes.length - 1 });
			left = tokens.length - 1;
			right = tokens.length - 1;
			content = node.content;
		} else {
			for (let i = 0; i < node.parse.length; i++) {
				res = calc(node.parse[i]);
				height = Math.max(height, res.height);
				left = Math.min(left, res.left);
				right = Math.max(right, res.right);
				content += res.content;
			}
			height += 1;
		}
		nodes[index].height = height;
		nodes[index].left = left;
		nodes[index].right = right;
		nodes[index].content = content;
		return { height: height, left: left, right: right, content: content };
	};

	const level = (node: any, height: number) => {
		if (nodes[node.index].height <= height) {
			for (let i = 0; i < nodes[node.index].right - nodes[node.index].left + 1; i++) {
				levels[height].push(node.index);
			}
			return;
		}
		for (let i = 0; i < node.parse.length; i++) {
			level(node.parse[i], height);
		}
	};

	const getStyles = (tokenIdx: number, levelIdx: number, side: boolean): string => {
		let styles = '';
		let left = tokenIdx == 0 || levels[levelIdx][tokenIdx] != levels[levelIdx][tokenIdx - 1];
		let right =
			tokenIdx == tokens.length - 1 || levels[levelIdx][tokenIdx] != levels[levelIdx][tokenIdx + 1];
		let top = levelIdx == 0 || levels[levelIdx][tokenIdx] != levels[levelIdx - 1][tokenIdx];
		let bottom =
			levelIdx == levels.length - 1 || levels[levelIdx][tokenIdx] != levels[levelIdx + 1][tokenIdx];

		if (side) {
			if (left) styles += 'pl-1 ';
			if (right) styles += 'pr-1 ';
			if (top) styles += 'pt-1 ';
			if (bottom) styles += 'pb-1 ';
		} else {
			if (top && left) styles += 'rounded-tl-lg ';
			if (top && right) styles += 'rounded-tr-lg ';
			if (bottom && left) styles += 'rounded-bl-lg ';
			if (bottom && right) styles += 'rounded-br-lg ';
		}

		return styles;
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key == 'ArrowUp') {
			e.preventDefault();
			for (let i = 0; i < levels.length; i++) {
				for (let j = 0; j < levels[i].length; j++) {
					if (levels[i][j] == selected) {
						if (i > 0) {
							selected = levels[i - 1][j];
							return;
						}
					}
				}
			}
		} else if (e.key == 'ArrowDown') {
			e.preventDefault();
			for (let i = levels.length - 1; i >= 0; i--) {
				for (let j = 0; j < levels[i].length; j++) {
					if (levels[i][j] == selected) {
						if (i < levels.length - 1) {
							selected = levels[i + 1][j];
							return;
						}
					}
				}
			}
		} else if (e.key == 'ArrowLeft') {
			e.preventDefault();
			for (let i = 0; i < levels.length; i++) {
				for (let j = 0; j < levels[i].length; j++) {
					if (levels[i][j] == selected) {
						if (j > 0) {
							selected = levels[i][j - 1];
							return;
						}
					}
				}
			}
		} else if (e.key == 'ArrowRight') {
			e.preventDefault();
			for (let i = 0; i < levels.length; i++) {
				for (let j = levels[i].length - 1; j >= 0; j--) {
					if (levels[i][j] == selected) {
						if (j < levels[i].length - 1) {
							selected = levels[i][j + 1];
							return;
						}
					}
				}
			}
		}
	};
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if showInfo}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50"></div>
	<Info bind:showInfo />
{/if}

<div class="w-screen px-0 md:px-20 pb-20 pt-6">
	<div class="mx-10 md:mx-32">
		<div
			role="button"
			tabindex="0"
			on:click={() => (status = 0)}
			on:keydown={null}
			class="flex items-center space-x-2 w-fit"
		>
			<img class="w-10" src="/juzi.png" alt="juzi" />
			<h1 class="text-3xl pt-1">Juzi</h1>
		</div>

		<div class="flex justify-center items-center mt-4 space-x-3">
			<input
				class="p-2 rounded-lg w-full text-md md:text-2xl"
				type="text"
				placeholder="enter any chinese sentence..."
				bind:value={inputValue}
			/>
			<button on:click={submit} class="text-md md:text-2xl py-2 px-6 w-32">submit</button>
		</div>
		<div class="flex mt-2 items-center">
			<button on:click={getExample} class="px-2 py-1">random</button>
			<button on:click={() => (showInfo = true)} class="px-2 py-1 ml-2 whitespace-nowrap"
				>info ?</button
			>

			<input id="showPinyin" type="checkbox" class="scale-150 ml-4" bind:checked={showPinyin} />
			<label for="showPinyin" class="text-xl ml-2">show pinyin</label>
		</div>
	</div>
	<div class="mt-10">
		{#if status == 0}
			<div
				class="flex justify-center flex-col space-y-4 items-center bg-orange-300 rounded-lg w-11/12 md:w-8/12 mx-auto p-8"
			>
				<div class="text-xl md:text-3xl text-center">
					<div>Welcome to Juzi, your friendly Chinese sentence parser</div>
					<div>Type in any sentence to begin!</div>
				</div>

				<img class="w-32 h-32" src="/juzi.png" alt="juzi" />
			</div>
		{:else if status == 1}
			<img class="mx-auto animate-spin text-5xl rounded-full w-32" src="/juzi.png" alt="juzi" />
		{:else if status == 2}
			<div
				class="flex justify-center flex-col space-y-4 items-center bg-orange-300 rounded-lg w-11/12 md:w-8/12 mx-auto p-8"
			>
				<div class="text-xl md:text-3xl text-center">
					<div>whoopsies</div>
					<div>{error}</div>
				</div>

				<img class="w-32 h-32" src="/juzi.png" alt="juzi" />
			</div>
		{:else if status == 3}
			<div class="flex flex-col">
				<div
					class="mx-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-2 mt-6 min-h-60 bg-orange-300 p-4 rounded-lg w-11/12 md:w-8/12 {showPinyin
						? 'mb-3'
						: 'mb-8'}"
				>
					<div class="w-full md:w-1/2 space-y-2">
						<div class="bg-orange-500 py-0.5 px-2 rounded-lg w-fit">chinese</div>
						<div class="bg-orange-400 p-2 rounded-lg text-lg">{nodes[selected].content}</div>
						{#if dict[nodes[selected].content] && dict[nodes[selected].content].length != 0}
							<div class="flex">
								<div class="bg-orange-500 py-0.5 px-2 rounded-lg w-fit mr-2">dictionary</div>
								<div class="flex items-center space-x-1">
									<button
										on:click={() => {
											definition = Math.max(definition - 1, 0);
										}}
										class="px-2 focus:outline-none">{'<'}</button
									>
									<div>{definition + 1 + '/' + dict[nodes[selected].content].length}</div>
									<button
										on:click={() => {
											definition = Math.min(
												definition + 1,
												dict[nodes[selected].content].length - 1
											);
										}}
										class="px-2 focus:outline-none">{'>'}</button
									>
								</div>
							</div>
							<div class="bg-orange-400 p-2 rounded-lg text-lg">
								{dict[nodes[selected].content][definition].english}: {dict[nodes[selected].content][
									definition
								].pinyin}
							</div>
						{/if}
					</div>
					<div class="w-full md:w-1/2 space-y-2">
						<div class="bg-orange-500 py-0.5 px-2 rounded-lg w-fit">english</div>
						<div class="bg-orange-400 p-2 rounded-lg text-lg">{nodes[selected].translation}</div>
						{#if tokenNum != -1}
							<div class="bg-orange-500 py-0.5 px-2 rounded-lg w-fit">class</div>
							<div class="p-2 rounded-lg text-lg {classColors[tokens[tokenNum].class]}">
								{tokens[tokenNum].class}
							</div>
						{/if}
					</div>
				</div>

				<div class="flex mx-auto overflow-x-scroll px-2">
					{#each tokens as token, tokenIdx (token)}
						<div class="flex flex-col">
							{#if showPinyin}
								<div class="text-center text-sm whitespace-nowrap">{token.pinyin}</div>
							{/if}
							<div
								class="mb-4
                                {tokenIdx >= nodes[selected].left &&
									tokenIdx <= nodes[selected].right &&
									'bg-orange-300'} 
                                {tokenIdx == nodes[selected].left && 'rounded-l-lg'} {tokenIdx ==
									nodes[selected].right && 'rounded-r-lg'}"
							>
								<div
									role="button"
									tabindex="0"
									on:keydown={null}
									on:click={() => (selected = token.nodeIndex)}
									class="{classColors[
										token.class
									]} hover:scale-110 transition-transform focus:outline-none p-2 m-2 rounded-lg"
								>
									<div class="text-sm md:text-lg whitespace-nowrap text-center">
										{token.content}
									</div>
								</div>
							</div>

							{#each levels as level, levelIdx (level)}
								<div
									role="button"
									tabindex="0"
									on:keydown={null}
									on:focus={null}
									on:click={() => (selected = level[tokenIdx])}
									on:mouseover={() => (hover = level[tokenIdx])}
									on:mouseleave={() => (hover = -1)}
									class="focus:outline-none h-10 {getStyles(tokenIdx, levelIdx, true)}"
								>
									<div
										class="{level[tokenIdx] == selected ? 'bg-orange-400' : 'bg-orange-500'} {level[
											tokenIdx
										] == hover && 'scale-110'} transition-transform h-full w-full {getStyles(
											tokenIdx,
											levelIdx,
											false
										)}"
									/>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
