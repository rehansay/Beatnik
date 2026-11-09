"""Add user owned playlists and ordered playlist tracks.

Revision ID: 0003_custom_playlists
Revises: 0002_email_password_accounts
Create Date: 2026-11-09
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_custom_playlists"
down_revision = "0002_email_password_accounts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "playlists",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_playlists_user_created", "playlists", ["user_id", "created_at"])

    op.create_table(
        "playlist_tracks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("playlist_id", sa.Integer(), nullable=False),
        sa.Column("track_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("added_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["playlist_id"], ["playlists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["track_id"], ["tracks.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("playlist_id", "track_id", name="uq_playlist_tracks_playlist_track"),
        sa.UniqueConstraint("playlist_id", "position", name="uq_playlist_tracks_playlist_position"),
    )


def downgrade() -> None:
    op.drop_table("playlist_tracks")
    op.drop_index("ix_playlists_user_created", table_name="playlists")
    op.drop_table("playlists")
