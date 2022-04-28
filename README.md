# Thexr

## developers

The easiest way to get a local running instance is to use vscode developer container.
Simply open this folder using vscode and when it prompts you to open as dev container, do it.

To start your server at the vscode terminal panel use: ./server.sh

Copy .env.sample to .env (ignored by git) to add secrets

====

## Useful

- to hop into psql, open docker desktop, expand thexr_devcontainer created by vscode, click the CLI button next to the thexr_devcontainer-db-1
- psql -U postgres thexr_dev
- \dt (describe tables)

## To deploy to gigalixir (not in vscode terminal, in regular terminal)

./deploy.sh

## run migrations on gigalixir

gigalixir ps:migrate

## If developing: To reset DB on gigalixir

- login to gigalixr if on free tier just delete and recreate db

## Learn more

  * Official website: https://www.phoenixframework.org/
  * Guides: https://hexdocs.pm/phoenix/overview.html
  * Docs: https://hexdocs.pm/phoenix
  * Forum: https://elixirforum.com/c/phoenix-forum
  * Source: https://github.com/phoenixframework/phoenix
