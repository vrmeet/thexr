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

  @impl true
  def fetch("space:" <> slug, presences) do
    ets_ref = Thexr.SpaceServer.ets_ref(slug)

    :ets.tab2list(ets_ref)
    |> Enum.reduce(
      presences,
      fn {member_id, {p0, p1, p2, r0, r1, r2, r3}}, acc ->
        if Map.has_key?(presences, member_id) do
          put_in(presences, [member_id, "at"], %{
            "pos" => [p0, p1, p2],
            "rot" => [r0, r1, r2, r3]
          })
        else
          acc
        end
      end
    )
  end

  # def get_members_last_pos_rots(_member_ids, ets_ref) do
  #   for {member_id, p0, p1, p2, r0, r1, r2, r3, left, right} <- :ets.tab2list(ets_ref),
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
