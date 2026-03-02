"""
Cron-based scheduler for the ingestion worker.
Runs on Railway as a long-lived process.
"""

import logging
import signal
import sys
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

from src.config import CRON_SCHEDULE, TIMEZONE
from src.utils.logging import setup_logging
from src.jobs.ingestion import run_ingestion

logger = logging.getLogger(__name__)


def main():
    """Start the scheduler."""
    setup_logging()
    logger.info("Article ingestion worker starting")
    logger.info(f"Schedule: {CRON_SCHEDULE} ({TIMEZONE})")

    scheduler = BlockingScheduler()

    # Parse cron expression
    parts = CRON_SCHEDULE.split()
    trigger = CronTrigger(
        minute=parts[0],
        hour=parts[1],
        day=parts[2],
        month=parts[3],
        day_of_week=parts[4],
        timezone=TIMEZONE,
    )

    scheduler.add_job(
        run_ingestion,
        trigger=trigger,
        id="daily_ingestion",
        name="Daily Article Ingestion",
        kwargs={"job_type": "incremental"},
        misfire_grace_time=3600,  # Allow 1 hour late
    )

    # Graceful shutdown
    def shutdown(signum, frame):
        logger.info("Received shutdown signal, stopping scheduler...")
        scheduler.shutdown(wait=False)
        sys.exit(0)

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    # Run an immediate ingestion on first startup (optional)
    logger.info("Running initial ingestion check...")
    try:
        run_ingestion(job_type="incremental")
    except Exception as e:
        logger.error(f"Initial ingestion failed (non-fatal): {e}")

    logger.info("Scheduler started. Waiting for next scheduled run...")
    scheduler.start()


if __name__ == "__main__":
    main()
