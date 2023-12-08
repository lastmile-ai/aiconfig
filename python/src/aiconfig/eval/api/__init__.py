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

from ..metrics import brevity, substring_match, is_sufficiently_whitespacy

__all__ = [
    "Metric",
    "brevity",
    "substring_match",
    "is_sufficiently_whitespacy",
    "run_test_suite_with_inputs",
    "run_test_suite_outputs_only",
    "TestSuiteWithInputsSettings",
]
