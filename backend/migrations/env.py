import logging
import os
from logging.config import fileConfig

from alembic import context
from flask import current_app

config = context.config

# Load logging config only if alembic.ini exists (flask db upgrade in container may not copy it)
if config.config_file_name and os.path.exists(config.config_file_name):
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = current_app.extensions["migrate"].db.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=current_app.config.get("SQLALCHEMY_DATABASE_URI"),
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = current_app.extensions["migrate"].db.engine

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
