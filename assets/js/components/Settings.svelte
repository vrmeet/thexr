<script>
    import { getContext } from "svelte";
    import { query, operationStore, mutation } from "@urql/svelte";
    const slug = getContext("slug");

    const toCamel = (s) => {
        return s.replace(/([-_][a-z])/gi, ($1) => {
            return $1.toUpperCase().replace("-", "").replace("_", "");
        });
    };

    const updateSpaceMutation = mutation({
        query: `
      mutation( $spaceInput: SpaceInput!) {
        updateSpace(slug: "${slug}", attributes: $spaceInput) {
            slug
            settings
        }
      }
    `,
    });

    const space = operationStore(`
query {
  space(slug: "${slug}") {
    id
    settings
  }
}
`);
    let settings = {};
    query(space);
    space.subscribe((value) => {
        if (value.data) {
            settings = value.data.space.settings;
        }
    });
</script>

{#if $space.fetching}
    <p>Loading...</p>
{:else if $space.error}
    <p>Oh no... {$space.error.message}</p>
{:else}
    <h2>Settings</h2>
    <form
        on:submit|preventDefault={async () => {
            let camelCaseSettings = Object.keys(settings).reduce((acc, key) => {
                acc[toCamel(key)] = settings[key];
                return acc;
            }, {});
            console.log(
                "settings",
                JSON.stringify({ settings: camelCaseSettings })
            );
            let result = await updateSpaceMutation({
                spaceInput: { settings: camelCaseSettings },
            });
            console.log("result", JSON.stringify(result));
        }}
    >
        {#each Object.keys(settings) as setting}
            <span>{setting}</span>
            <input type="text" name={setting} bind:value={settings[setting]} />
        {/each}
        <button type="submit">Save</button>
    </form>
{/if}
