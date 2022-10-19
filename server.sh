# Local .env
if [ -f .env ]; then

    set -o allexport
    source .env
    set +o allexport

    ERL_AFLAGS="-kernel shell_history enabled" iex -S mix phx.server

else

  echo "I'm expecting a .env file"

fi

