<script lang="ts">
	import { fade } from 'svelte/transition';
	export let showInfo: boolean;
</script>

<div
	in:fade={{ duration: 300 }}
	class="fixed inset-0 flex justify-center items-center z-50 w-11/12 md:w-7/12 mx-auto"
>
	<div class="bg-orange-200 p-8 rounded-lg">
		<div class="flex justify-between items-center">
			<h1 class="font-bold text-xl md:text-3xl">
				About Juzi
				<img src="/juzi.png" alt="juzi" class="mb-2 w-10 h-10 inline-block" />
			</h1>
			<button
				on:click={() => (showInfo = false)}
				class="text-3xl w-8 h-8 md:w-10 md:h-10 rounded-full">&times;</button
			>
		</div>
		<div class="mt-4">
			<div class="text-sm md:text-xl">
				<div>
					<div>
						Juzi is a sentence parser designed to help you break down Chinese sentences into
						grammatical components. Each component in the syntax tree presents its own meaning in
						context to help you understand the overall meaning and structure of the sentence.
					</div>
				</div>
				<div class="mt-4">
					<div class="font-bold text-lg md:text-2xl">Usage</div>
					<div>
						Simply type in any Chinese sentence and press submit, or click random if you're feeling
						lucky!
					</div>
					<div>
						You can then traverse the syntax tree with your arrow keys, or directly click on a node.
						Individual words will have both it's class in context, as well as dictionary entries.
					</div>
					<div>
						(Note: sometimes GPT-4 may mess up the parsing and give you a weird result, but it's
						usually pretty good if you don't try to break it!)
					</div>
				</div>
				<div class="mt-4">
					<div class="font-bold text-lg md:text-2xl">Technologies</div>
					<div>
						<div>1. GPT-4 chat completions for sentence parsing</div>
						<div>2. Redis KV for dictionary</div>
						<div>3. Vercel for serverless deployment</div>
						<div>4. SvelteKit for frontend</div>
					</div>
				</div>
				<div class="mt-4">
					<div>made with ❤️ by vishy</div>
				</div>
			</div>
		</div>
	</div>
</div>
