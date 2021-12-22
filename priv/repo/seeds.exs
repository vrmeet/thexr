# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Thexr.Repo.insert!(%Thexr.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

alias Thexr.Spaces.Template
alias Thexr.Repo

Repo.insert!(%Template{
  name: "Arena",
  description: "Example Arena Space",
  data: """
  <scene>
    <box name="a" position="3 2 0"/>
  </scene>
  """
})

Repo.insert!(%Template{
  name: "Towers",
  description: "Example Towers Space",
  data: """
  <scene>
    <box name="a" position="0 0 0"/>
    <box name="b" position="0 1 0"/>
    <box name="c" position="0 2 0"/>
  </scene>
  """
})
