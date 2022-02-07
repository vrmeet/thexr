<script>
    import { createForm } from "svelte-forms-lib";
    import * as yup from "yup";
    export let component;
    export let update;

    const { errors, handleChange, handleSubmit } = createForm({
        initialValues: {
            value: component.data.value,
        },
        validationSchema: yup.object().shape({
            value: yup
                .string()
                .matches(
                    /^\#[0-9A-Fa-f]{6}$/,
                    "Invalid Color String, example: #FF0000 for red"
                )
                .required(),
        }),
        onSubmit: (values) => {
            console.log(JSON.stringify(values));
            update();
        },
    });
</script>

<form on:submit|preventDefault={handleSubmit} on:blur={handleSubmit}>
    {#each Object.keys(component.data) as key}
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
