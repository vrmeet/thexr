# Thexr

## developers

The easiest way to get a local running instance is to use vscode developer container.
Simply open this root folder using vscode and when it prompts you to open as dev container, do it.

Copy .env.sample to .env (ignored by git) to add secrets

Install your AWS creds at .aws using aws cli configure command.  (Required to run cdk)

Run node install inside the infra/ directory to install dependencies to run cdk for AWS resources.

npx cdk deploy will create an eventbus, sqs, dynamoDB table used for logging.

To start your server at the vscode terminal panel use: ./server.sh this will load the .env variables and make them available to the server.



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

## To deploy a different branch to gigalixir

git push gigalixir yourbranch:master

## Learn more

  * Official website: https://www.phoenixframework.org/
  * Guides: https://hexdocs.pm/phoenix/overview.html
  * Docs: https://hexdocs.pm/phoenix
  * Forum: https://elixirforum.com/c/phoenix-forum
  * Source: https://github.com/phoenixframework/phoenix
