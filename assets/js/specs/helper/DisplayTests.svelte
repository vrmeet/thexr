<script lang="ts">
import type { TestResult } from "./runner"
let text = "hi"
export let results: TestResult[] ;

</script>




<ul>
{#each results as result, i}
	<li class="{result.status === "ok" ? 'green' : 'red'}">
	  {result.message}
      {#if (result.status === 'failed')}
        <strong>{JSON.stringify(result.error)}</strong>
      {/if}
    </li>
{/each}
</ul>

<style>
    li {
        list-style-type: none; /* Remove bullets */
    }
    .red {
        border: 1px solid red;
    }
    .green {
        border: 1px solid green;
    }
</style>



