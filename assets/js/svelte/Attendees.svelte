<script lang="ts">
  import { getContext } from "svelte";
  import type { Context } from "../context";
  import type { ServiceAttendees } from "../services/service-attendees";
  
  let context: Context = getContext("context");
  const serviceAttendees = context.services['service-attendees'] as ServiceAttendees
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