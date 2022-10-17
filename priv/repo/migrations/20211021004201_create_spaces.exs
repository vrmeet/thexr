defmodule Thexr.Repo.Migrations.CreateSpaces do
  use Ecto.Migration

  def change do
    create table(:spaces, primary_key: false) do
      add :id, :string, primary_key: true
      add :name, :string, null: false
      add :description, :text
      # add :settings, :map, default: %{}, null: false
      add :state_id, :string, null: false
      timestamps()
    end
  end
end
