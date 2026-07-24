"""add categories

Revision ID: a1b2c3d4e5f6
Revises: 89f93b292260
Create Date: 2026-07-21 18:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '89f93b292260'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('color', sa.String(), nullable=False, server_default='#6366f1'),
        sa.Column('icon', sa.String(), nullable=False, server_default='Tag'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    with op.batch_alter_table('habits', schema=None) as batch_op:
        batch_op.add_column(sa.Column('category_id', sa.Integer(), nullable=True, server_default='1'))
        batch_op.create_foreign_key('fk_habits_category_id', 'categories', ['category_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    with op.batch_alter_table('habits', schema=None) as batch_op:
        batch_op.drop_constraint('fk_habits_category_id', type_='foreignkey')
        batch_op.drop_column('category_id')
    op.drop_table('categories')
