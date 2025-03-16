# yourapp/management/commands/run_optimization.py

from django.core.management.base import BaseCommand
from match.tasks import run_optimization  # tasks.py内の最適化関数をインポート

class Command(BaseCommand):
    help = 'Runs optimization tasks like cleaning up old data, vacuuming database, clearing cache, etc.'

    def handle(self, *args, **kwargs):
        # 最適化タスクを実行
        self.stdout.write("Starting optimization task...")

        # run_optimization関数の実行
        try:
            run_optimization()
            self.stdout.write(self.style.SUCCESS('Successfully ran optimization task'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"An error occurred while running the optimization task: {e}"))
