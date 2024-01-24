"""This file is officially the eval API.    

Usage:

from aiconfig.eval.api import (
    brevity,
    substring_match,
    run_test_suite_with_inputs,
    TestSuiteWithInputsSettings,
)
"""
from .. import common, metrics

# pyright: reportWildcardImportFromLibrary=false
from ..lib import (
    TestSuiteWithInputsSettings,
    run_test_suite_outputs_only,
    run_test_suite_with_inputs,
)

__all__ = [
    "common",
    "metrics",
    "run_test_suite_outputs_only",
    "run_test_suite_with_inputs",
    "TestSuiteWithInputsSettings",
]
