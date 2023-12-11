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

from ..common import Metric

from ..metrics import brevity, substring_match

__all__ = [
    "Metric",
    "brevity",
    "substring_match",
    "run_test_suite_with_inputs",
    "run_test_suite_outputs_only",
    "TestSuiteWithInputsSettings",
]
