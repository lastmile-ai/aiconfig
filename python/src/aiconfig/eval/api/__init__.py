"""This file is officially the eval API.    

Usage:

from aiconfig.eval.api import (
    brevity,
    substring_match,
    run_test_suite_with_inputs,
    TestSuiteWithInputsSettings,
)
"""
# pyright: reportWildcardImportFromLibrary=false
from ..lib import (
    TestSuiteWithInputsSettings,
    run_test_suite_with_inputs,
    run_test_suite_outputs_only,
)

from .. import metrics
from ..metrics import Metric, brevity, substring_match

__all__ = [
    "Metric",
    "metrics",
    "brevity",
    "substring_match",
    "run_test_suite_with_inputs",
    "run_test_suite_outputs_only",
    "TestSuiteWithInputsSettings",
]
