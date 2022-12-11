<script lang="ts">
  import { getContext } from "svelte";
  import type { SystemAttendance } from "../xrs-ecs/systems/attendance";
  import type { XRS } from "../xrs-ecs/xrs";

  let xrs: XRS = getContext("xrs");
  const serviceAttendees = xrs.getSystem("attendance") as SystemAttendance;
  const nicknames = Object.values(serviceAttendees.entities).map(
    (comp) => comp.data.nickname
  );
</script>

{#each nicknames as nickname}
  <div>
    {nickname}
  </div>
{/each}

<style>
  div {
    border: 1px solid white;
    display: block;
  }
</style>
