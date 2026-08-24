#!/usr/bin/env python3
# Copyright (c) Cratis. All rights reserved.
# Licensed under the MIT license. See LICENSE file in the project root for full license information.
"""Restructure an eval workspace and add summary fields to each grading result."""
import argparse
import json
import shutil
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("workspace", type=Path, help="Eval workspace to restructure")
arguments = parser.parse_args()
workspace = arguments.workspace.resolve()

if not workspace.is_dir():
    parser.error(f"workspace is not a directory: {workspace}")

for grading_file in sorted(workspace.rglob("grading.json")):
    parent = grading_file.parent
    if parent.name not in ("with_skill", "without_skill"):
        continue

    with open(grading_file, encoding="utf-8") as grading_stream:
        grading = json.load(grading_stream)

    expectations = grading.get("expectations", [])
    passed = sum(1 for expectation in expectations if expectation.get("passed", False))
    failed = len(expectations) - passed
    total = len(expectations)
    pass_rate = round(passed / total, 4) if total > 0 else 0.0

    grading["summary"] = {
        "pass_rate": pass_rate,
        "passed": passed,
        "failed": failed,
        "total": total
    }

    run_dir = parent / "run-1"
    run_dir.mkdir(exist_ok=True)

    with open(run_dir / "grading.json", "w", encoding="utf-8") as grading_stream:
        json.dump(grading, grading_stream, indent=2)

    timing_file = parent / "timing.json"
    if timing_file.exists():
        shutil.copy(timing_file, run_dir / "timing.json")

    print(f"OK {parent.parent.parent.name}/{parent.parent.name}/{parent.name} pass_rate={pass_rate} ({passed}/{total})")

print("Done!")
