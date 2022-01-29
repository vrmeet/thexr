# Thexr

## developers

The easiest way to get a local running instance is to use vscode developer container.
Simply open this folder using vscode and when it prompts you to open as dev container, do it.

To start your server at the vscode terminal panel use: ./server.sh

Copy .env.sample to .env (ignored by git) to add secrets

====

To start your Phoenix server:

  * Install dependencies with `mix deps.get`
  * Create and migrate your database with `mix ecto.setup`
  * Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html).

## Useful

- to hop into psql, click CLI in docker desktop for thexr-dev-env_devcontainer_db_1
- psql -U postgres thexr_dev
- \dt (describe tables)

## Learn more

  * Official website: https://www.phoenixframework.org/
  * Guides: https://hexdocs.pm/phoenix/overview.html
  * Docs: https://hexdocs.pm/phoenix
  * Forum: https://elixirforum.com/c/phoenix-forum
  * Source: https://github.com/phoenixframework/phoenix
