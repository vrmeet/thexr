<script lang="ts">
import type { DescribeResult } from "./runner"
let text = "hi"
export let describeResults: DescribeResult[] ;

</script>




<ul>
{#each describeResults as describe}
    <li>
        {describe.message}
        <ul>
            {#each describe.testResults as result}
            <li class="{result.status === "ok" ? 'green' : 'red'}">
                {result.message}
                {#if (result.status === 'failed')}
                  <strong>{JSON.stringify(result.error)}</strong>
                {/if}
            </li>
            {/each}
        </ul>
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



