defmodule ThexrWeb.Presence do
  use Phoenix.Presence,
    otp_app: :thexr,
    pubsub_server: Thexr.PubSub

  # example presence
  # %{
  #   "ErhlnZ" => %{metas: [%{phx_ref: "FtBT87Y-5Zxt8AbB"}]},
  #   "k7f4Wl" => %{metas: [%{phx_ref: "FtBTpR8bUdBt8ARD"}]}
  # }
  # example ets table
  # :ets.tab2list(ref)
  # [
  #   {"ErhlnZ", {0, 1.7, -8, 0, 0, 0, 1}},
  #   {"k7f4Wl", {0, 1.7, -4.62905, -0.03143, 0.22985, 0.00743, 0.97269}}
  # ]
  #
  # prone to race conditions, because either the presence list has the member_id first
  # or the ets table can have the member_id first, leading to incomplete data
  # to mitigate this, we also populate metas on first Track

  @impl true
  def fetch("space:" <> slug, presences) do
    {member_movements, member_states} = Thexr.SpaceServer.ets_refs(slug)

    :ets.tab2list(member_movements)
    |> Enum.reduce(
      presences,
      fn {member_id, {p0, p1, p2, r0, r1, r2, r3}}, acc ->
        if Map.has_key?(presences, member_id) do
          meta = List.first(presences[member_id].metas)

          meta =
            Map.put(meta, "pos_rot", %{
              "pos" => [p0, p1, p2],
              "rot" => [r0, r1, r2, r3]
            })

          meta = Map.put(meta, "state", get_member_state(member_states, member_id))

          put_in(presences, [member_id, :metas], [meta])
          |> IO.inspect(label: "put_in #{member_id}")
        else
          acc |> IO.inspect(label: "else #{member_id}")
        end
      end
    )
  end

  def get_member_state(member_states, member_id) do
    result = :ets.lookup(member_states, member_id) |> IO.inspect(label: "result for #{member_id}")

    case result do
      [{_member_id, payload}] ->
        payload

      a ->
        %{"error" => a}
    end
  end

  # def get_members_last_pos_rots(_member_ids, ets_refs) do
  #   for {member_id, p0, p1, p2, r0, r1, r2, r3, left, right} <- :ets.tab2list(ets_refs),
  #       into: %{} do
  #     {member_id,
  #      %{
  #        "cam" => %{"p" => [p0, p1, p2], "r" => [r0, r1, r2, r3]},
  #        "left" => left,
  #        "right" => right
  #      }}
  #   end
  # end
end
