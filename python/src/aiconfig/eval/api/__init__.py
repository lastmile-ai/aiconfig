"""This file is officially the eval API.    

Usage:

from aiconfig.eval.api import (
    brevity,
    substring_match,
    run_test_suite_with_inputs,
    TestSuiteWithInputsSettings,
)
"""
from .. import test_suite_common, test_suite_metrics

# pyright: reportWildcardImportFromLibrary=false
from ..test_suite_lib import (
    TestSuiteWithInputsSettings,
    run_test_suite_outputs_only,
    run_test_suite_with_inputs,
)
from ..test_suite_metrics import TestSuiteMetric, brevity, substring_match

__all__ = [
    "TestSuiteMetric",
    "test_suite_common",
    "test_suite_metrics",
    "brevity",
    "substring_match",
    "run_test_suite_with_inputs",
    "run_test_suite_outputs_only",
    "TestSuiteWithInputsSettings",
]
