defmodule ThexrWeb.Presence do
  use Phoenix.Presence,
    otp_app: :thexr,
    pubsub_server: Thexr.PubSub

  # @impl true
  # def fetch("space:" <> slug, presences) do
  #   {:ok, ets_ref} = VRMeet.Spaces.Server.get_ets_ref(slug)
  #   members_last_pos_rots = presences |> Map.keys() |> get_members_last_pos_rots(ets_ref)

  #   for {key, %{metas: metas}} <- presences, into: %{} do
  #     {key, %{metas: metas, at: members_last_pos_rots[key]}}
  #   end
  # end

  # @spec get_members_last_pos_rots(any, atom | :ets.tid()) :: map
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
