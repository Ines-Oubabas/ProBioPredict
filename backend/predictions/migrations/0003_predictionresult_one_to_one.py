import django.db.models.deletion
from django.db import migrations, models
from django.db.models import Count


def check_prediction_result_uniqueness(apps, schema_editor):
    PredictionResult = apps.get_model(
        "predictions",
        "PredictionResult",
    )
    database_alias = schema_editor.connection.alias

    duplicates = (
        PredictionResult.objects.using(database_alias)
        .values("prediction_id")
        .annotate(result_count=Count("id"))
        .filter(result_count__gt=1)
        .order_by("prediction_id")
    )

    duplicate_prediction_count = duplicates.count()

    if duplicate_prediction_count == 0:
        return

    examples = list(duplicates[:20])
    details = ", ".join(
        (
            f"Prediction #{item['prediction_id']} : "
            f"{item['result_count']} résultats"
        )
        for item in examples
    )

    if duplicate_prediction_count > len(examples):
        details += (
            f", ... ({duplicate_prediction_count - len(examples)} "
            "autres Predictions concernées)"
        )

    raise RuntimeError(
        "Migration interrompue : impossible de convertir la relation "
        "PredictionResult.prediction en OneToOneField. "
        f"{duplicate_prediction_count} Prediction(s) possèdent plusieurs "
        f"PredictionResult. Détails : {details}. "
        "Aucune donnée n'a été supprimée ou sélectionnée automatiquement. "
        "Examinez ces données et décidez manuellement de leur traitement, "
        "puis relancez la migration."
    )


class Migration(migrations.Migration):
    atomic = True

    dependencies = [
        (
            "predictions",
            "0002_alter_prediction_options_prediction_is_pinned",
        ),
    ]

    operations = [
        migrations.RunPython(
            check_prediction_result_uniqueness,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="predictionresult",
            name="prediction",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="result",
                to="predictions.prediction",
            ),
        ),
    ]