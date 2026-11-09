"""Allow password based accounts and Google account linking.

Revision ID: 0002_email_password_accounts
Revises: 0001_initial_collections
Create Date: 2026-11-09
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_email_password_accounts"
down_revision = "0001_initial_collections"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_users_google_sub", table_name="users")
    op.drop_constraint("uq_users_google_sub", "users", type_="unique")
    op.alter_column("users", "google_sub", existing_type=sa.String(length=255), nullable=True)
    op.add_column("users", sa.Column("password_hash", sa.String(length=512), nullable=True))
    op.create_unique_constraint("uq_users_google_sub", "users", ["google_sub"])
    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.create_index("ix_users_google_sub", "users", ["google_sub"])


def downgrade() -> None:
    op.drop_index("ix_users_google_sub", table_name="users")
    op.drop_constraint("uq_users_email", "users", type_="unique")
    op.drop_constraint("uq_users_google_sub", "users", type_="unique")
    op.drop_column("users", "password_hash")
    op.alter_column("users", "google_sub", existing_type=sa.String(length=255), nullable=False)
    op.create_unique_constraint("uq_users_google_sub", "users", ["google_sub"])
    op.create_index("ix_users_google_sub", "users", ["google_sub"])
