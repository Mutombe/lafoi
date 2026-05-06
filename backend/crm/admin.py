from django.contrib import admin

from .models import Customer, Project, ProjectFile, ProjectUpdate


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "customer_type", "city", "phone", "email", "created_at")
    list_filter = ("customer_type", "city")
    search_fields = ("name", "email", "phone", "contact_person")


class ProjectFileInline(admin.TabularInline):
    model = ProjectFile
    extra = 0


class ProjectUpdateInline(admin.TabularInline):
    model = ProjectUpdate
    extra = 0
    fields = ("title", "progress_snapshot", "status_snapshot", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "customer", "status", "category", "progress", "created_at")
    list_filter = ("status", "category")
    search_fields = ("code", "title", "customer__name")
    readonly_fields = ("code", "created_at", "updated_at")
    inlines = (ProjectUpdateInline, ProjectFileInline)


@admin.register(ProjectUpdate)
class ProjectUpdateAdmin(admin.ModelAdmin):
    list_display = ("project", "title", "progress_snapshot", "created_at")
    list_filter = ("project",)


@admin.register(ProjectFile)
class ProjectFileAdmin(admin.ModelAdmin):
    list_display = ("project", "kind", "title", "uploaded_at")
    list_filter = ("kind",)
