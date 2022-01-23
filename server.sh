# Local .env
if [ -f .env ]; then

    set -o allexport
    source .env
    set +o allexport

    iex -S mix phx.server

else

  echo "I'm expecting a .env file"

fi

