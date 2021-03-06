# config valid for current version and patch releases of Capistrano
lock "~> 3.11.0"

set :application, "script-editor"
set :repo_url, "git@github.com:bragnikita/scripts-server-node.git"

set :branch, proc { `git rev-parse --abbrev-ref HEAD`.chomp }

set :deploy_to, "/var/www/#{fetch(:application)}"

set :pty,             false
set :stage,           :production


# Default value for :format is :airbrussh.
# set :format, :airbrussh

# You can configure the Airbrussh format using :format_options.
# These are the defaults.
# set :format_options, command_output: true, log_file: "log/capistrano.log", color: :auto, truncate: :auto

# Default value for :linked_files is []
append :linked_files, ".env"

# Default value for linked_dirs is []
append :linked_dirs, "logs", "public", "uploads"

# Default value for default_env is {}
set :default_env, { NODE_ENV: fetch(:stage) }


# Default value for local_user is ENV['USER']
# set :local_user, -> { `git config user.name`.chomp }

# Default value for keep_releases is 5
# set :keep_releases, 5

# Uncomment the following to require manually verifying the host key before first deploy.
# set :ssh_options, verify_host_key: :secure

set :npm_run_script, "build"
set :app_command, "dist/app.js"

namespace :deploy do
  desc 'Rebuild application'
  task :node_build do
    invoke 'npm:install'
    invoke 'npm:run_script'
  end
  desc 'Restart application'
  task :restart do
    invoke 'pm2:restart'
  end
  after :published, :restart
  after :updated, :node_build
end