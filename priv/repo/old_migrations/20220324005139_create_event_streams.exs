defmodule Thexr.Repo.Migrations.CreateEvents do
  use Ecto.Migration

  # def change do
  #   create table(:event_streams, primary_key: false) do
  #     add :id, :binary_id, primary_key: true
  #     add :sequence, :bigint, default: 0, null: false
  #     add :event, :map, default: %{}, null: false
  #     add :space_id, references(:spaces, on_delete: :delete_all, type: :binary_id)
  #     timestamps(updated_at: false)
  #   end

  #   create unique_index(:event_streams, [:space_id, :sequence])
  # end
end
