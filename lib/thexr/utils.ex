defmodule Thexr.Utils do
  def random_id(length \\ 5) do
    Enum.reduce(0..length, [], fn _, acc ->
      [Enum.random('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') | acc]
    end)
    |> to_string()
  end

  def errors_on(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, opts} ->
      Regex.replace(~r"%{(\w+)}", message, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
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

  def member_states_to_map(ets_ref) do
    :ets.tab2list(ets_ref)
    |> Enum.reduce(%{}, fn {member_id, payload}, acc ->
      Map.put(acc, member_id, payload)
    end)
  end

  def movements_to_map(ets_ref) do
    :ets.tab2list(ets_ref)
    |> Enum.reduce(%{}, fn {member_id, {p0, p1, p2, r0, r1, r2, r3}}, acc ->
      payload = %{
        "pos_rot" => %{
          "pos" => [p0, p1, p2],
          "rot" => [r0, r1, r2, r3]
        }
      }

      Map.put(acc, member_id, payload)
    end)
  end
end
