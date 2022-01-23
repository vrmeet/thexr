set -o allexport
source .env
set +o allexport

iex -S mix phx.server

