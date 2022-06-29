
# UPDATE event-names.ts INSTEAD OF THIS FILE
# THIS FILE IS AUTOGENERATED, DO NOT MANUALLY UPDATE
#
defmodule EventName do

  def int_to_atom(1000), do: :member_entered
  def int_to_atom(1010), do: :member_left
  def int_to_atom(1020), do: :member_moved
  def int_to_atom(1030), do: :member_observed
  def int_to_atom(1040), do: :member_changed_mic_pref
  def int_to_atom(1050), do: :member_changed_nickname
  def int_to_atom(1060), do: :member_damaged
  def int_to_atom(1070), do: :member_died
  def int_to_atom(1080), do: :member_respawned
  def int_to_atom(2200), do: :entity_created
  def int_to_atom(4000), do: :entity_transformed
  def int_to_atom(4010), do: :entity_translated
  def int_to_atom(4020), do: :entity_rotated
  def int_to_atom(4030), do: :entity_scaled
  def int_to_atom(4040), do: :entity_colored
  def int_to_atom(4050), do: :entity_deleted
  def int_to_atom(5000), do: :entity_grabbed
  def int_to_atom(5010), do: :entity_released
  def int_to_atom(5020), do: :entity_trigger_squeezed
  def int_to_atom(6000), do: :hud_message_broadcasted
  def int_to_atom(7000), do: :agent_spawned
  def int_to_atom(7100), do: :agents_directed
  def int_to_atom(7200), do: :agent_hit
  def int_to_atom(8000), do: :target_hit

  def atom_to_int(:member_entered), do: 1000
  def atom_to_int(:member_left), do: 1010
  def atom_to_int(:member_moved), do: 1020
  def atom_to_int(:member_observed), do: 1030
  def atom_to_int(:member_changed_mic_pref), do: 1040
  def atom_to_int(:member_changed_nickname), do: 1050
  def atom_to_int(:member_damaged), do: 1060
  def atom_to_int(:member_died), do: 1070
  def atom_to_int(:member_respawned), do: 1080
  def atom_to_int(:entity_created), do: 2200
  def atom_to_int(:entity_transformed), do: 4000
  def atom_to_int(:entity_translated), do: 4010
  def atom_to_int(:entity_rotated), do: 4020
  def atom_to_int(:entity_scaled), do: 4030
  def atom_to_int(:entity_colored), do: 4040
  def atom_to_int(:entity_deleted), do: 4050
  def atom_to_int(:entity_grabbed), do: 5000
  def atom_to_int(:entity_released), do: 5010
  def atom_to_int(:entity_trigger_squeezed), do: 5020
  def atom_to_int(:hud_message_broadcasted), do: 6000
  def atom_to_int(:agent_spawned), do: 7000
  def atom_to_int(:agents_directed), do: 7100
  def atom_to_int(:agent_hit), do: 7200
  def atom_to_int(:target_hit), do: 8000

end
        