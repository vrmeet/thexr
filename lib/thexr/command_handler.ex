defmodule Thexr.CommandHandler do
  def handle_command("enter", payload, time_in_ms) do
    {"member_entered", payload, time_in_ms}
  end
end
