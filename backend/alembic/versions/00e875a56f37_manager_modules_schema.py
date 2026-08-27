"""manager_modules_schema

Revision ID: 00e875a56f37
Revises: 00e875a56f36
Create Date: 2026-08-25 14:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '00e875a56f37'
down_revision: Union[str, None] = '00e875a56f36'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create users table (for Managers)
    try:
        op.create_table('users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('branch_id', sa.Integer(), nullable=False),
            sa.Column('email', sa.String(length=100), nullable=True),
            sa.Column('username', sa.String(length=100), nullable=False),
            sa.Column('hashed_password', sa.String(length=255), nullable=False),
            sa.Column('full_name', sa.String(length=100), nullable=False),
            sa.Column('role', sa.String(length=50), nullable=False, server_default='MANAGER'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
            sa.Column('last_login', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['branch_id'], ['branches.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
        op.create_index(op.f('ix_users_branch_id'), 'users', ['branch_id'], unique=False)
    except Exception:
        pass

    # 2. Add is_outdoor_marketing_employee and profile_photo_url to employees
    try:
        with op.batch_alter_table('employees') as batch_op:
            batch_op.add_column(sa.Column('is_outdoor_marketing_employee', sa.Boolean(), nullable=False, server_default=sa.text('0')))
            batch_op.add_column(sa.Column('profile_photo_url', sa.String(length=255), nullable=True))
    except Exception:
        pass

    # 3. Create customer_activities
    try:
        op.create_table('customer_activities',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('branch_id', sa.Integer(), nullable=False),
            sa.Column('employee_id', sa.Integer(), nullable=False),
            sa.Column('customer_name', sa.String(length=150), nullable=False),
            sa.Column('phone_number', sa.String(length=20), nullable=False),
            sa.Column('activity_date', sa.Date(), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='Attended'),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['branch_id'], ['branches.id']),
            sa.ForeignKeyConstraint(['employee_id'], ['employees.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_customer_activities_id'), 'customer_activities', ['id'], unique=False)
        op.create_index(op.f('ix_customer_activities_branch_id'), 'customer_activities', ['branch_id'], unique=False)
        op.create_index(op.f('ix_customer_activities_employee_id'), 'customer_activities', ['employee_id'], unique=False)
        op.create_index(op.f('ix_customer_activities_activity_date'), 'customer_activities', ['activity_date'], unique=False)
    except Exception:
        pass

    # 4. Create scheme_records
    try:
        op.create_table('scheme_records',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('branch_id', sa.Integer(), nullable=False),
            sa.Column('employee_id', sa.Integer(), nullable=False),
            sa.Column('customer_name', sa.String(length=150), nullable=False),
            sa.Column('scheme_name', sa.String(length=150), nullable=False),
            sa.Column('amount', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('record_date', sa.Date(), nullable=False),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['branch_id'], ['branches.id']),
            sa.ForeignKeyConstraint(['employee_id'], ['employees.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_scheme_records_id'), 'scheme_records', ['id'], unique=False)
        op.create_index(op.f('ix_scheme_records_branch_id'), 'scheme_records', ['branch_id'], unique=False)
        op.create_index(op.f('ix_scheme_records_employee_id'), 'scheme_records', ['employee_id'], unique=False)
        op.create_index(op.f('ix_scheme_records_record_date'), 'scheme_records', ['record_date'], unique=False)
    except Exception:
        pass

    # 5. Create employee_form_media
    try:
        op.create_table('employee_form_media',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('branch_id', sa.Integer(), nullable=False),
            sa.Column('employee_id', sa.Integer(), nullable=False),
            sa.Column('form_type', sa.String(length=100), nullable=False),
            sa.Column('file_path', sa.String(length=255), nullable=False),
            sa.Column('file_url', sa.String(length=255), nullable=False),
            sa.Column('mime_type', sa.String(length=50), nullable=False),
            sa.Column('file_size', sa.Integer(), nullable=False),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('upload_date', sa.DateTime(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['branch_id'], ['branches.id']),
            sa.ForeignKeyConstraint(['employee_id'], ['employees.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_employee_form_media_id'), 'employee_form_media', ['id'], unique=False)
        op.create_index(op.f('ix_employee_form_media_branch_id'), 'employee_form_media', ['branch_id'], unique=False)
        op.create_index(op.f('ix_employee_form_media_employee_id'), 'employee_form_media', ['employee_id'], unique=False)
        op.create_index(op.f('ix_employee_form_media_upload_date'), 'employee_form_media', ['upload_date'], unique=False)
    except Exception:
        pass

    # 6. Create google_reviews
    try:
        op.create_table('google_reviews',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('branch_id', sa.Integer(), nullable=False),
            sa.Column('employee_id', sa.Integer(), nullable=True),
            sa.Column('customer_name', sa.String(length=150), nullable=False),
            sa.Column('review_date', sa.Date(), nullable=False),
            sa.Column('rating', sa.Integer(), nullable=False, server_default='5'),
            sa.Column('review_text', sa.Text(), nullable=False),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('screenshot_url', sa.String(length=255), nullable=True),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='Published'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['branch_id'], ['branches.id']),
            sa.ForeignKeyConstraint(['employee_id'], ['employees.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_google_reviews_id'), 'google_reviews', ['id'], unique=False)
        op.create_index(op.f('ix_google_reviews_branch_id'), 'google_reviews', ['branch_id'], unique=False)
        op.create_index(op.f('ix_google_reviews_employee_id'), 'google_reviews', ['employee_id'], unique=False)
        op.create_index(op.f('ix_google_reviews_review_date'), 'google_reviews', ['review_date'], unique=False)
    except Exception:
        pass

    # 7. Create attire_records
    try:
        op.create_table('attire_records',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('branch_id', sa.Integer(), nullable=False),
            sa.Column('employee_id', sa.Integer(), nullable=False),
            sa.Column('check_date', sa.Date(), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='Proper'),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('image_url', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['branch_id'], ['branches.id']),
            sa.ForeignKeyConstraint(['employee_id'], ['employees.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_attire_records_id'), 'attire_records', ['id'], unique=False)
        op.create_index(op.f('ix_attire_records_branch_id'), 'attire_records', ['branch_id'], unique=False)
        op.create_index(op.f('ix_attire_records_employee_id'), 'attire_records', ['employee_id'], unique=False)
        op.create_index(op.f('ix_attire_records_check_date'), 'attire_records', ['check_date'], unique=False)
    except Exception:
        pass

    # 8. Create outdoor_marketing_areas
    try:
        op.create_table('outdoor_marketing_areas',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('branch_id', sa.Integer(), nullable=False),
            sa.Column('area_name', sa.String(length=150), nullable=False),
            sa.Column('location', sa.String(length=255), nullable=False),
            sa.Column('assigned_employee_id', sa.Integer(), nullable=True),
            sa.Column('activity_date', sa.Date(), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='Planned'),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['branch_id'], ['branches.id']),
            sa.ForeignKeyConstraint(['assigned_employee_id'], ['employees.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_outdoor_marketing_areas_id'), 'outdoor_marketing_areas', ['id'], unique=False)
        op.create_index(op.f('ix_outdoor_marketing_areas_branch_id'), 'outdoor_marketing_areas', ['branch_id'], unique=False)
        op.create_index(op.f('ix_outdoor_marketing_areas_area_name'), 'outdoor_marketing_areas', ['area_name'], unique=False)
    except Exception:
        pass

    # 9. Create outdoor_marketing_customers
    try:
        op.create_table('outdoor_marketing_customers',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('branch_id', sa.Integer(), nullable=False),
            sa.Column('marketing_employee_id', sa.Integer(), nullable=False),
            sa.Column('customer_name', sa.String(length=150), nullable=False),
            sa.Column('phone', sa.String(length=20), nullable=False),
            sa.Column('area_name', sa.String(length=150), nullable=False),
            sa.Column('scheme_name', sa.String(length=150), nullable=True),
            sa.Column('date', sa.Date(), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='Lead'),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['branch_id'], ['branches.id']),
            sa.ForeignKeyConstraint(['marketing_employee_id'], ['employees.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_outdoor_marketing_customers_id'), 'outdoor_marketing_customers', ['id'], unique=False)
        op.create_index(op.f('ix_outdoor_marketing_customers_branch_id'), 'outdoor_marketing_customers', ['branch_id'], unique=False)
        op.create_index(op.f('ix_outdoor_marketing_customers_marketing_employee_id'), 'outdoor_marketing_customers', ['marketing_employee_id'], unique=False)
    except Exception:
        pass

    # 10. Create outdoor_marketing_schemes
    try:
        op.create_table('outdoor_marketing_schemes',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('branch_id', sa.Integer(), nullable=False),
            sa.Column('employee_id', sa.Integer(), nullable=False),
            sa.Column('date', sa.Date(), nullable=False),
            sa.Column('scheme_name', sa.String(length=150), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('area', sa.String(length=150), nullable=False),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['branch_id'], ['branches.id']),
            sa.ForeignKeyConstraint(['employee_id'], ['employees.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_outdoor_marketing_schemes_id'), 'outdoor_marketing_schemes', ['id'], unique=False)
        op.create_index(op.f('ix_outdoor_marketing_schemes_branch_id'), 'outdoor_marketing_schemes', ['branch_id'], unique=False)
        op.create_index(op.f('ix_outdoor_marketing_schemes_employee_id'), 'outdoor_marketing_schemes', ['employee_id'], unique=False)
    except Exception:
        pass

    # 11. Create outdoor_marketing_activities
    try:
        op.create_table('outdoor_marketing_activities',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('branch_id', sa.Integer(), nullable=False),
            sa.Column('employee_id', sa.Integer(), nullable=False),
            sa.Column('date', sa.Date(), nullable=False),
            sa.Column('area', sa.String(length=150), nullable=False),
            sa.Column('schemes_promoted', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('customers_generated', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('customers_attended', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('customers_closed', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('image_url', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['branch_id'], ['branches.id']),
            sa.ForeignKeyConstraint(['employee_id'], ['employees.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_outdoor_marketing_activities_id'), 'outdoor_marketing_activities', ['id'], unique=False)
        op.create_index(op.f('ix_outdoor_marketing_activities_branch_id'), 'outdoor_marketing_activities', ['branch_id'], unique=False)
        op.create_index(op.f('ix_outdoor_marketing_activities_employee_id'), 'outdoor_marketing_activities', ['employee_id'], unique=False)
    except Exception:
        pass


def downgrade() -> None:
    op.drop_table('outdoor_marketing_activities')
    op.drop_table('outdoor_marketing_schemes')
    op.drop_table('outdoor_marketing_customers')
    op.drop_table('outdoor_marketing_areas')
    op.drop_table('attire_records')
    op.drop_table('google_reviews')
    op.drop_table('employee_form_media')
    op.drop_table('scheme_records')
    op.drop_table('customer_activities')
    try:
        with op.batch_alter_table('employees') as batch_op:
            batch_op.drop_column('profile_photo_url')
            batch_op.drop_column('is_outdoor_marketing_employee')
    except Exception:
        pass
    op.drop_table('users')
