"""Print the most-visited pages and most-clicked items.

    python -m scripts.analytics_report            # last 30 days
    python -m scripts.analytics_report --days 7
    python -m scripts.analytics_report --page /map  # clicks on one page only

The data is daily totals from analytics_daily; nothing identifies a visitor.
"""

import argparse

from sqlalchemy import text


def report(conn, days: int = 30, page: str | None = None, limit: int = 15) -> dict[str, list]:
    since = {"days": days}
    views = conn.execute(text("""
        SELECT path, sum(count) AS views FROM analytics_daily
        WHERE kind = 'view' AND day > current_date - make_interval(days => :days)
        GROUP BY path ORDER BY views DESC, path LIMIT :limit
    """), {**since, "limit": limit}).all()
    clicks = conn.execute(text(f"""
        SELECT path, target, sum(count) AS clicks FROM analytics_daily
        WHERE kind = 'click' AND day > current_date - make_interval(days => :days)
          {"AND path = :page" if page else ""}
        GROUP BY path, target ORDER BY clicks DESC, path, target LIMIT :limit
    """), {**since, "limit": limit, "page": page}).all()
    return {"views": views, "clicks": clicks}


def main() -> None:
    from app.core.database import engine

    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--days", type=int, default=30)
    ap.add_argument("--page", help="only clicks on this path, e.g. /map")
    ap.add_argument("--limit", type=int, default=15)
    args = ap.parse_args()
    with engine.connect() as conn:
        r = report(conn, args.days, args.page, args.limit)

    print(f"\nMost visited pages, last {args.days} days")
    for row in r["views"] or [("(no visits yet)", "")]:
        print(f"  {str(row[1]):>6}  {row[0]}")
    print(f"\nMost clicked{' on ' + args.page if args.page else ''}, last {args.days} days")
    for row in r["clicks"] or [("(no clicks yet)", "", "")]:
        print(f"  {str(row[2]):>6}  {row[0]:<12} {row[1]}")
    print()


if __name__ == "__main__":
    main()
