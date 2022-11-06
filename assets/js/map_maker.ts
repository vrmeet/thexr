/// <reference types="svelte" />
import Main from "./svelte/map_maker/Main.svelte";
window.addEventListener("DOMContentLoaded", async () => {
  new Main({
    target: document.body,
  });
});
