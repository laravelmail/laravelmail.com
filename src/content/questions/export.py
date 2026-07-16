#!/usr/bin/env python3
"""
Export each blog post (with non‑null blog_post) to a separate JSON file.

Usage:
    python export_blog_posts.py database.sqlite [--folder json_posts]
    [--author "Name"] [--role "Role"] [--avatar "/path.jpg"]
"""

import argparse
import json
import sqlite3
import re
import unicodedata
from datetime import datetime
from pathlib import Path

# Default values for metadata
DEFAULT_AUTHOR = "Stefan Bogdanescu"
DEFAULT_ROLE = "Founder & Senior Architect"
DEFAULT_AVATAR = "/avatar-stefan.jpg"
DEFAULT_IMAGE = None
DEFAULT_TAGS = []


def slugify(text: str, max_len: int = 50) -> str:
    """Convert a string to a safe filename slug."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    text = re.sub(r"[-\s]+", "-", text)
    return text[:max_len]


def strip_html(text: str) -> str:
    """Remove HTML tags and normalize whitespace."""
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def generate_excerpt(content: str, max_len: int = 160) -> str:
    """Create a plain‑text excerpt from HTML content."""
    plain = strip_html(content)
    if len(plain) <= max_len:
        return plain
    cut = plain[:max_len].rsplit(" ", 1)[0]
    return cut + "..."


def main():
    parser = argparse.ArgumentParser(description="Export blog posts to separate JSON files")
    parser.add_argument("database", help="Path to SQLite database file")
    parser.add_argument("--folder", "-f", default="json_posts", help="Output folder (default: json_posts)")
    parser.add_argument("--author", default=DEFAULT_AUTHOR, help="Author name")
    parser.add_argument("--role", default=DEFAULT_ROLE, help="Author role")
    parser.add_argument("--avatar", default=DEFAULT_AVATAR, help="Avatar image path")
    parser.add_argument("--image", default=DEFAULT_IMAGE, help="Main image URL/path (null if omitted)")
    parser.add_argument("--tags", nargs="*", default=DEFAULT_TAGS, help="List of tags")
    args = parser.parse_args()

    db_path = Path(args.database)
    if not db_path.exists():
        print(f"Error: Database '{db_path}' not found.")
        return 1

    # Connect and fetch posts with non‑null blog_post
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, title, blog_post, created_at
        FROM blog_posts
        WHERE blog_post IS NOT NULL AND blog_post != ''
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        print("No posts with blog_post found.")
        return 0

    # Create output folder
    out_dir = Path(args.folder)
    out_dir.mkdir(parents=True, exist_ok=True)

    for row in rows:
        # Prepare date
        created = row["created_at"]
        if created:
            try:
                if isinstance(created, str):
                    dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                else:
                    dt = datetime.fromisoformat(str(created))
                date_str = dt.strftime("%Y-%m-%d")
            except Exception:
                date_str = str(created)[:10]
        else:
            date_str = None

        content = row["blog_post"]
        excerpt = generate_excerpt(content)

        post = {
            "title": row["title"],
            "date": date_str,
            "author": args.author,
            "authorRole": args.role,
            "authorAvatar": args.avatar,
            "excerpt": excerpt,
            "image": args.image,
            "tags": args.tags,
            "content": content,
        }

        # Generate filename: id + slugified title
        slug = slugify(row["title"])
        filename = f"{row['id']}-{slug}.json"
        # If slug is empty (e.g., title only symbols), just use id
        if not slug:
            filename = f"{row['id']}.json"

        filepath = out_dir / filename
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(post, f, indent=2, ensure_ascii=False)

        print(f"Exported: {filepath}")

    print(f"\nDone. {len(rows)} posts written to '{out_dir}/'")
    return 0


if __name__ == "__main__":
    exit(main())
