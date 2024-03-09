<script lang="ts">
	interface Token {
		content: string;
		class: string;
		translation: string;
		nodeIndex: number;
        pinyin: string;
	}
	interface Node {
		index: number;
		translation: string;
		height: number;
		left: number;
		right: number;
	}

    let showPinyin = false;
	let inputValue = '';
    let parse: any = {
  "translation": "This is what the Chinese dissident group thought upon hearing the news of Navalny's death amidst grief and shock",
  "parse": [
    {
      "translation": "This is",
      "parse": [
        {
          "content": "这",
          "class": "pronoun",
          "pinyin": "zhè",
          "translation": "this"
        },
        {
          "content": "就是",
          "class": "verb",
          "pinyin": "jiù shì",
          "translation": "is"
        }
      ]
    },
    {
      "translation": "the Chinese dissident group",
      "parse": [
        {
          "content": "中国",
          "class": "noun",
          "pinyin": "zhōng guó",
          "translation": "Chinese"
        },
        {
          "content": "异见者",
          "class": "noun",
          "pinyin": "yì jiàn zhě",
          "translation": "dissidents"
        },
        {
          "content": "群体",
          "class": "noun",
          "pinyin": "qún tǐ",
          "translation": "group"
        }
      ]
    },
    {
      "translation": "upon hearing the news of Navalny's death amidst grief and shock",
      "parse": [
        {
          "translation": "amidst grief and shock",
          "parse": [
            {
              "content": "在",
              "class": "preposition",
              "pinyin": "zài",
              "translation": "in"
            },
            {
              "translation": "grief and shock",
              "parse": [
                {
                  "content": "悲痛",
                  "class": "noun",
                  "pinyin": "bēi tòng",
                  "translation": "grief"
                },
                {
                  "content": "和",
                  "class": "conjunction",
                  "pinyin": "hé",
                  "translation": "and"
                },
                {
                  "content": "震惊",
                  "class": "noun",
                  "pinyin": "zhèn jīng",
                  "translation": "shock"
                }
              ]
            },
            {
              "content": "中",
              "class": "noun",
              "pinyin": "zhōng",
              "translation": "among"
            }
          ]
        },
        {
          "translation": "seeing the news of Navalny's death",
          "parse": [
            {
              "content": "看到",
              "class": "verb",
              "pinyin": "kàn dào",
              "translation": "see"
            },
            {
              "translation": "the news of Navalny's death",
              "parse": [
                {
                  "content": "纳瓦尔尼",
                  "class": "noun",
                  "pinyin": "Nà wǎ ěr ní",
                  "translation": "Navalny"
                },
                {
                  "content": "去世",
                  "class": "verb",
                  "pinyin": "qù shì",
                  "translation": "death"
                },
                {
                  "content": "消息",
                  "class": "noun",
                  "pinyin": "xiāo xī",
                  "translation": "news"
                },
                {
                  "content": "时",
                  "class": "noun",
                  "pinyin": "shí",
                  "translation": "when"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "translation": "thought",
      "parse": [
        {
          "content": "的",
          "class": "particle",
          "pinyin": "de",
          "translation": "of"
        },
        {
          "content": "想法",
          "class": "noun",
          "pinyin": "xiǎng fǎ",
          "translation": "thought"
        }
      ]
    }
  ]
};
	

	let status = 2;
	let tokens: Token[] = [];
	let levels: number[][] = [];
	let nodes: Node[] = [];
	let selected = 0;
	let maxHeight = 0;

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
			.then((res) => res.json())
			.then((data) => {
				parse = data;
				status = 2;
				getData();
			});
	};

	const calc = (node: any): { height: number; left: number; right: number } => {
		let res = { height: 0, left: 0, right: 0 };
		let height = 0,
			left = tokens.length,
			right = 0;
		let index = nodes.length;
		node.index = nodes.length;
		nodes.push({
			index: nodes.length,
			translation: node.translation,
			height: 0,
			left: 0,
			right: 0
		});
		if (!node.parse) {
			tokens.push({ ...node, nodeIndex: nodes.length - 1 });
			left = tokens.length - 1;
			right = tokens.length - 1;
		} else {
			for (let i = 0; i < node.parse.length; i++) {
				res = calc(node.parse[i]);
				height = Math.max(height, res.height);
				left = Math.min(left, res.left);
				right = Math.max(right, res.right);
			}
			height += 1;
		}
		nodes[index].height = height;
		nodes[index].left = left;
		nodes[index].right = right;
		return { height: height, left: left, right: right };
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
	getData();

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

        e.preventDefault();

        if(e.key == "ArrowUp"){
            for(let i = 0; i < levels.length; i++){
                for(let j = 0; j < levels[i].length; j++){
                    if(levels[i][j] == selected){
                        if(i > 0){
                            selected = levels[i-1][j];
                            return;
                        }
                    }
                }
            }
        } else if(e.key == "ArrowDown"){
            for(let i = levels.length - 1; i >= 0; i--){
                for(let j = 0; j < levels[i].length; j++){
                    if(levels[i][j] == selected){
                        if(i < levels.length - 1){
                            selected = levels[i+1][j];
                            return;
                        }
                    }
                }
            }
        } else if(e.key == "ArrowLeft"){
            for(let i = 0; i < levels.length; i++){
                for(let j = 0; j < levels[i].length; j++){
                    if(levels[i][j] == selected){
                        if(j > 0){
                            selected = levels[i][j-1];
                            return;
                        }
                    }
                }
            }
        } else if(e.key == "ArrowRight"){
            for(let i = 0; i < levels.length; i++){
                for(let j = levels[i].length - 1; j >= 0; j--){
                    if(levels[i][j] == selected){
                        if(j < levels[i].length - 1){
                            selected = levels[i][j+1];
                            return;
                        }
                    }
                }
            }
        }
    };
</script>
<svelte:window on:keydown={handleKeyDown} />
<div class="h-screen w-screen p-20">
    <div class="mx-32">
        <div class="flex justify-center items-center mt-20 space-x-3">
            <input
                class="p-2 rounded-lg w-full text-2xl"
                type="text"
                placeholder="请输入任意句子"
                bind:value={inputValue}
            />
            <button on:click={submit} class="text-2xl py-2 px-6 text-white w-32">提交</button>
        </div>
        <div class="flex space-x-2 mt-2 ml-4">
            <input id="showPinyin" type="checkbox" class="scale-150" bind:checked={showPinyin} />
            <label for="showPinyin" class="text-xl">显示拼音</label>
        </div>
        
    </div>
	<div class="mt-10">
		{#if status == 1}
			<img class="mx-auto animate-spin text-5xl rounded-full w-16" src="/juzi.png" alt="juzi" />
		{:else if status == 2}
			<div class="center">
                <div class="my-6 mx-auto min-h-32 bg-orange-300 p-4 rounded-lg w-8/12">
                    <div class="bg-orange-500 py-0.5 px-2 rounded-lg w-min">translation</div>
                    <div class="text-lg">{nodes[selected].translation}</div>
                </div>

				<div class="flex justify-center mt-4">
                    

					{#each tokens as token, tokenIdx}
						<div class="flex flex-col">
                            {#if showPinyin}
                            <div class="text-center">{token.pinyin}</div>
                            {/if}
							<div
								class="mb-4
                                {tokenIdx >= nodes[selected].left &&
									tokenIdx <= nodes[selected].right &&
									'bg-orange-300'} 
                                {tokenIdx == nodes[selected].left && 'rounded-l-lg'} {tokenIdx ==
									nodes[selected].right && 'rounded-r-lg'}"
							>
								<button on:click={() => (selected = token.nodeIndex)} class="p-2 m-2 rounded-lg">
									<div class="text-2xl">{token.content}</div>
								</button>
							</div>

							{#each levels as level, levelIdx}
								<div
									role="button"
									tabindex="0"
									on:keydown={null}
									on:click={() => (selected = level[tokenIdx])}
									class="focus:outline-none h-10 {getStyles(tokenIdx, levelIdx, true)}"
								>
									<div
										class="{level[tokenIdx] == selected
											? 'bg-orange-400'
											: 'bg-orange-500'} h-full w-full {getStyles(tokenIdx, levelIdx, false)}"
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
