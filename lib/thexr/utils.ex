defmodule Thexr.Utils do
  def random_id(length \\ 5) do
    Enum.reduce(0..length, [], fn _, acc ->
      [Enum.random('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') | acc]
    end)
    |> to_string()
  end

  def rand_int() do
    Enum.random(-2_147_483_648..2_147_483_647)
  end

  # extracts a symbol for the event name which is more meaningful in pattern
  # matching scenarios
  def tupleize_event_payload(payload) do
    atomized = AtomicMap.convert(payload, %{safe: false})
    {EventName.int_to_atom(atomized.m), atomized}
  end
end
