defmodule Thexr.CommandHandler do
  def handle_command({"member_join", payload}) do
    {"member_joined", payload}
  end
end
