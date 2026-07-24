"""add target_days to habits

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-21 19:53:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('habits', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'target_days',
                sa.String(),
                nullable=False,
                server_default='1,2,3,4,5,6,7',
            )
        )


def downgrade() -> None:
    with op.batch_alter_table('habits', schema=None) as batch_op:
        batch_op.drop_column('target_days')
