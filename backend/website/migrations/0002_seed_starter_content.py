"""Seed the starter content blocks wired live on Home, About and Services.

Idempotent: uses get_or_create keyed on (page, section, key), so re-running or
editing values in the admin is safe — this only fills gaps, never overwrites.
"""
from django.db import migrations


SEED = [
    # page, section, key, type, label, value, order
    # ---- Home ----
    ("home", "hero", "status", "text", "Hero status pill",
     "Stretch ceilings · Architectural lighting · Harare", 0),
    ("home", "finish", "title", "text", "Finish library — headline accent",
     "Every colour you can imagine.", 0),
    ("home", "finish", "intro", "richtext", "Finish library — intro paragraph",
     "Every finish answers a different brief — calm or theatrical, silent or sculptural. "
     "We help you choose the one your space is asking for.", 1),

    # ---- About ----
    ("about", "hero", "eyebrow", "text", "Hero eyebrow", "Who we are", 0),
    ("about", "hero", "p1", "richtext", "Hero paragraph 1",
     "Founded January 2024 in Belgravia, Harare, Zimbabwe’s first dedicated stretch "
     "ceiling and architectural lighting studio.", 1),
    ("about", "hero", "p2", "richtext", "Hero paragraph 2",
     "Built on one conviction: the ceiling deserves the same care as the floor beneath it. "
     "Premium stretch ceilings and bespoke lighting, installed in two to four days, "
     "depending on the design.", 2),
    ("about", "mission", "image", "image", "Mission section image",
     "/brand/images/30.png", 0),

    # ---- Services ----
    ("services", "hero", "eyebrow", "text", "Hero eyebrow", "Eight services · One studio", 0),
    ("services", "hero", "subcopy", "richtext", "Hero sub-copy",
     "Eight services, each engineered to stand alone, designed to work together — from the "
     "ceiling overhead to the floor, wall and finish that meet it.", 1),
]


def seed(apps, schema_editor):
    ContentBlock = apps.get_model("website", "ContentBlock")
    for page, section, key, type_, label, value, order in SEED:
        ContentBlock.objects.get_or_create(
            page=page, section=section, key=key,
            defaults={"type": type_, "label": label, "value": value, "order": order},
        )


def unseed(apps, schema_editor):
    ContentBlock = apps.get_model("website", "ContentBlock")
    keys = [(p, s, k) for (p, s, k, *_rest) in SEED]
    for page, section, key in keys:
        ContentBlock.objects.filter(page=page, section=section, key=key).delete()


class Migration(migrations.Migration):
    dependencies = [("website", "0001_initial")]
    operations = [migrations.RunPython(seed, unseed)]
