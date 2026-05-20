"""Seed the studio's standard inventory categories.

These are the ones the team works with day-to-day. Admins can add more or
deactivate ones they don't use — this migration is idempotent (skips any
name that already exists), so it's safe to re-run.
"""
from django.db import migrations
from django.utils.text import slugify


DEFAULT_CATEGORIES = [
    'Profiles',
    'Fabric',
    'Accessories',
    'Power',
    'LED',
    'Dimming',
    'LED Strips',
    'Bidding',
    'Rings',
    'Lights',
]


def seed(apps, schema_editor):
    Category = apps.get_model('inventory', 'Category')
    for idx, name in enumerate(DEFAULT_CATEGORIES):
        if Category.objects.filter(name__iexact=name).exists():
            continue
        base = slugify(name)[:120] or 'category'
        slug = base
        n = 2
        while Category.objects.filter(slug=slug).exists():
            slug = f"{base}-{n}"
            n += 1
        Category.objects.create(name=name, slug=slug, sort_order=idx, is_active=True)


def noop(apps, schema_editor):
    # Don't unseed on reverse — these may now have items linked.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0003_item_size_spec'),
    ]

    operations = [
        migrations.RunPython(seed, reverse_code=noop),
    ]
