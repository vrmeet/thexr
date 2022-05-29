defmodule Thexr.Repo.Migrations.CreateSpaces do
  use Ecto.Migration

  def change do
    create table(:spaces, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :description, :text
      add :settings, :map, default: %{}, null: false
      timestamps()
    end
  end
end
