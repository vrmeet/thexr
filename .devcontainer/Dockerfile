FROM elixir:1.13.1

ENV SHELL /bin/bash

# Build Args
ARG PHOENIX_VERSION=1.6.6
ARG NODEJS_VERSION=16.x

# Apt
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y apt-utils
RUN apt-get install -y build-essential
RUN apt-get install -y inotify-tools

# Nodejs
RUN curl -sL https://deb.nodesource.com/setup_${NODEJS_VERSION} | bash
RUN apt-get install -y nodejs

# Phoenix
RUN mix local.hex --force
RUN mix archive.install --force hex phx_new #{PHOENIX_VERSION}
RUN mix local.rebar --force

# App Directory
ENV APP_HOME /app
RUN mkdir -p $APP_HOME

RUN npm i -g yarn \
  && apt-get autoremove -y \
  && apt-get clean -y \
  && rm -rf /var/lib/apt/lists/*

ARG USERNAME=thexr
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create the user
RUN groupadd --gid $USER_GID $USERNAME \
  && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
  #
  # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
  && apt-get update \
  && apt-get install -y sudo \
  && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
  && chmod 0440 /etc/sudoers.d/$USERNAME

# ********************************************************
# * Anything else you want to do like clean up goes here *
# ********************************************************

# [Optional] Set the default user. Omit if you want to keep the default as root.

RUN chown $USERNAME $APP_HOME
USER $USERNAME

WORKDIR $APP_HOME

# App Port
EXPOSE 4000



