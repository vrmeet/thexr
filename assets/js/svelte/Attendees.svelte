<script lang="ts">
  import { getContext } from "svelte";
  import type { Context } from "../context";
  import type { SystemAttendees } from "../ecs/builtin_systems/system-attendees";
  
  let context: Context = getContext("context");
  const serviceAttendees = context.systems['system-attendees'] as SystemAttendees
  const nicknames = Object.values(serviceAttendees.attendees).map(comp => comp.nickname)


</script>

{#each nicknames as nickname}
<div>
  { nickname }
</div>
{/each}

<style>
  div {
    border: 1px solid white;
    display: block;
  }  
</style>