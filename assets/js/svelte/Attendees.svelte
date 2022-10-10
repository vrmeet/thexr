<script lang="ts">
  import { getContext } from "svelte";
  import type { Context } from "../context";
  import type { SystemAttendance } from "../ecs/builtin_systems/system-attendance";

  let context: Context = getContext("context");
  const serviceAttendees = context.systems[
    "system-attendees"
  ] as SystemAttendance;
  const nicknames = Object.values(serviceAttendees.attendees).map(
    (comp) => comp.attendance.nickname
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
