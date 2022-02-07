<script>
    import { createForm } from "svelte-forms-lib";
    import * as yup from "yup";
    export let component;
    export let update;

    const { errors, handleChange, handleSubmit } = createForm({
        initialValues: {
            x: component.data.x,
            y: component.data.y,
            z: component.data.z,
        },
        validationSchema: yup.object().shape({
            x: yup.number().required(),
            y: yup.number().required(),
            z: yup.number().required(),
        }),
        onSubmit: (values) => {
            console.log(JSON.stringify(values));
            update();
        },
    });
</script>

<h3>Vector3</h3>
<form on:submit|preventDefault={handleSubmit} on:blur={update}>
    {#each Object.keys(component.data) as key}
        <div>{key}</div>
        <input
            name={key}
            on:change={handleSubmit}
            on:input={handleChange}
            type="text"
            bind:value={component.data[key]}
        />
        {#if $errors[key]}
            <small>{$errors[key]}</small>
        {/if}
    {/each}
</form>
