#!/usr/bin/env python3
"""CLI for bank product discovery and extraction."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlmodel import Session

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.db import engine  # noqa: E402
from app.services.ingest import discover_bank, extract_bank  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest bank products via Firecrawl")
    parser.add_argument("--bank", required=True, help="Bank slug from banks.yaml")
    parser.add_argument("--discover", action="store_true", help="Discover product URLs")
    parser.add_argument("--extract", action="store_true", help="Extract pending products")
    parser.add_argument("--all", action="store_true", help="Run discover then extract")
    parser.add_argument(
        "--limit",
        type=int,
        default=2,
        help="Max products to extract (default: 2)",
    )
    parser.add_argument(
        "--extract-limit",
        type=int,
        default=None,
        help="Extract limit when using --all (default: --limit value)",
    )
    args = parser.parse_args()

    extract_limit = args.extract_limit if args.extract_limit is not None else args.limit

    with Session(engine) as session:
        if args.all or args.discover:
            counts = discover_bank(session, args.bank)
            print(f"Discovered {sum(counts.values())} URLs for {args.bank}")
            for product_type, count in sorted(counts.items()):
                print(f"  {product_type}: {count}")
        if args.all or args.extract:
            results = extract_bank(session, args.bank, extract_limit)
            for item in results:
                print(
                    f"OK {item['nombre_producto']} "
                    f"(req={item['requisitos']}, ben={item['beneficios']}, "
                    f"promo={item['promociones']})"
                )


if __name__ == "__main__":
    main()
