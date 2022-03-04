defmodule ThexrWeb.Presence do
  use Phoenix.Presence,
    otp_app: :thexr,
    pubsub_server: Thexr.PubSub

  @impl true
  def fetch("space:" <> slug, presences) do
    {member_movements, member_states} = Thexr.SpaceServer.ets_refs(slug)

    for {key, %{metas: [meta]}} <- presences, into: %{} do
      new_metas = [
        Map.merge(meta, %{
          pos_rot: get_pos_rot(key, member_movements),
          state: get_state(key, member_states)
        })
      ]

      {key,
       %{
         metas: new_metas
       }}
    end
  end

  def get_pos_rot(key, ets_ref) do
    case :ets.lookup(ets_ref, key) do
      [{^key, {p0, p1, p2, r0, r1, r2, r3}}] ->
        %{
          "pos_rot" => %{
            "pos" => [p0, p1, p2],
            "rot" => [r0, r1, r2, r3]
          }
        }

      _ ->
        %{"error" => "not_found"}
    end
  end

  def get_state(key, ets_ref) do
    case :ets.lookup(ets_ref, key) do
      [{^key, payload}] ->
        payload

      _ ->
        %{"error" => "not_found"}
    end
  end
end
