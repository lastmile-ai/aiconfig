import asyncio
import logging
from abc import abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, Generic, NewType, Protocol, Sequence, Tuple, TypeVar

import lastmile_utils.lib.core.api as cu
import pandas as pd
from aiconfig.Config import AIConfigRuntime
from pydantic import root_validator
from result import Ok, Result

logger = logging.getLogger(__name__)
logging.basicConfig(format=cu.LOGGER_FMT)

# API

T_InputDatum = TypeVar("T_InputDatum", contravariant=True)
T_OutputDatum = TypeVar("T_OutputDatum", contravariant=True)


class EvaluationMetricMetadata(cu.Record, Generic[T_OutputDatum]):
    """A record to tie together metadata about an evaluation metric
    to ensure that numbers are interpreted as intended.

    Assumptions:
    * Metric type is float (bools and ints have to be represented as floats; tensors are not supported)
    * Value is monotonic in "goodness". i.e. there are two cases:
        higher is better
            e.g. accuracy, best_value=1.0, worst_value=0.0
            The higher the better over the entire range.
        lower is better
            e.g. error count, best_value=0.0, worst_value=inf
            The lower the better over the entire rane.
    """

    name: str
    description: str
    best_value: float
    worst_value: float


class SampleMetricValue(cu.Record, Generic[T_OutputDatum]):
    value: float
    interpretation: EvaluationMetricMetadata[T_OutputDatum]

    @root_validator(pre=True)
    def check_value_range(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        wv, bv = (
            values["interpretation"].worst_value,
            values["interpretation"].best_value,
        )
        value = values["value"]
        if wv == bv:
            raise ValueError("best_value and worst_value cannot be equal")
        if wv < bv and not wv <= value <= bv:
            raise ValueError(f"value {value} is not in range [{wv}, {bv}] (inclusive)")
        if wv > bv and not wv >= value >= bv:
            raise ValueError(f"value {value} is not in range [{bv}, {wv}] (inclusive)")

        return values


class SampleEvaluationFunction(Protocol, Generic[T_OutputDatum]):
    @abstractmethod
    def __call__(self, output_datum: T_OutputDatum) -> SampleMetricValue[T_OutputDatum]:
        pass


# Each test is a (input_datum, evaluation_fn) pair
UserTestSuiteWithInputs = NewType(
    "UserTestSuiteWithInputs", Sequence[Tuple[str, SampleEvaluationFunction[str]]]
)

UserTestSuiteOutputsOnly = NewType(
    "UserTestSuiteOutputsOnly", Sequence[Tuple[str, SampleEvaluationFunction[str]]]
)

TestSuiteWithInputsConfig = NewType("TestSuiteWithInputsConfig", dict[str, str])
"Empire State Building is on fifth avenue. What is the cross street?"


def contains_substring(
    output_datum: str, substring: str, case_sensitive: bool = False
) -> SampleMetricValue[str]:
    return SampleMetricValue(
        value=float(
            check_substring(output_datum, substring, case_sensitive=case_sensitive)
        ),
        interpretation=EvaluationMetricMetadata(
            name="contains_substring",
            description="1.0 (pass) if contains given substring",
            best_value=1.0,
            worst_value=0.0,
        ),
    )


def brevity(output_datum: str) -> SampleMetricValue[str]:
    return SampleMetricValue(
        value=float(len(output_datum)),
        interpretation=EvaluationMetricMetadata(
            name="brevity",
            description="Absolute text length",
            best_value=1.0,
            worst_value=float("inf"),
        ),
    )


async def run_test_suite_with_inputs(
    test_suite: UserTestSuiteWithInputs,
    config: TestSuiteWithInputsConfig,
) -> pd.DataFrame:
    res = await run_test_suite_helper(
        TestSuiteWithInputsSpec(test_suite=test_suite, config=config)
    )
    return res.unwrap_or_raise(ValueError)


async def run_test_suite_outputs_only(
    test_suite: UserTestSuiteOutputsOnly,
) -> pd.DataFrame:
    res = await run_test_suite_helper(TestSuiteOutputsOnlySpec(test_suite=test_suite))
    return res.unwrap_or_raise(ValueError)


# Implementation

T = TypeVar("T")


class NumericalEvalDataset(cu.Record):
    output: Sequence[float | int]
    ground_truth: Sequence[float | int]


TextInput = NewType("TextInput", str)
TextOutput = NewType("TextOutput", str)


# TODO:
# GenericBeforeBaseModelWarning: Classes should inherit from `BaseModel` before generic classes (e.g. `typing.Generic[T]`) for pydantic generics to work properly.
# But swapping the order breaks
class SampleEvaluationResult(Generic[T_InputDatum, T_OutputDatum], cu.Record):
    input_datum: T_InputDatum | None
    output_datum: T_OutputDatum
    metric_value: SampleMetricValue[T_OutputDatum]

    Tuple[T_OutputDatum, SampleMetricValue[T_OutputDatum]]


DatasetEvaluationResult = Sequence[SampleEvaluationResult[T_InputDatum, T_OutputDatum]]


@dataclass(frozen=True)
class SampleEvaluationParams(Generic[T_InputDatum, T_OutputDatum]):
    input_sample: T_InputDatum | None
    output_sample: T_OutputDatum
    evaluation_fn: SampleEvaluationFunction[T_OutputDatum]

    def __str__(self) -> str:
        return f"\nSampleEvaluationParams:\n\t{self.output_sample=}\n\t{self.evaluation_fn=}"


def evaluate(
    evaluation_params_list: Sequence[
        SampleEvaluationParams[T_InputDatum, T_OutputDatum]
    ],
) -> Result[
    DatasetEvaluationResult[T_InputDatum, T_OutputDatum], str
]:  # pyright: ignore[fixme, reportInvalidTypeVarUse]
    results: Sequence[SampleEvaluationResult[T_InputDatum, T_OutputDatum]] = []

    for eval_params in evaluation_params_list:
        sample, evaluation_fn = (
            eval_params.output_sample,
            eval_params.evaluation_fn,
        )
        res_ = evaluation_fn(sample)
        logger.debug(f"{res_=}")
        result = SampleEvaluationResult(
            input_datum=eval_params.input_sample, output_datum=sample, metric_value=res_
        )
        results.append(result)

    return Ok(results)


def eval_res_to_df(
    eval_res: DatasetEvaluationResult[T_InputDatum, T_OutputDatum],
) -> pd.DataFrame:
    records: list[dict[str, None | str | float | T_InputDatum | T_OutputDatum]] = []
    for sample_res in eval_res:
        records.append(
            dict(
                input=sample_res.input_datum,
                aiconfig_output=sample_res.output_datum,
                value=sample_res.metric_value.value,
                metric_name=sample_res.metric_value.interpretation.name,
                metric_description=sample_res.metric_value.interpretation.description,
                best_value=sample_res.metric_value.interpretation.best_value,
                worst_value=sample_res.metric_value.interpretation.worst_value,
            )
        )
    df = pd.DataFrame.from_records(records)  # type: ignore[no-untyped-call]
    for c in ["input", "aiconfig_output", "metric_name", "metric_description"]:
        df[c] = df[c].astype("string").fillna("Missing")  # type: ignore[no-untyped-call]

    return df


async def run_aiconfig(
    config: TestSuiteWithInputsConfig, input_datum: TextInput
) -> TextOutput:
    """Helper to run the AIConfig which makes the data to be evaluated."""
    # TODO: catch exceptions
    prompt_name = config["prompt_name"]
    aiconfig_path = config["aiconfig_path"]

    return TextOutput(
        await run_aiconfig_helper(aiconfig_path, prompt_name, input_datum)
    )


async def user_test_suite_with_inputs_to_eval_params_list(
    test_suite: UserTestSuiteWithInputs, config: TestSuiteWithInputsConfig
) -> Sequence[SampleEvaluationParams[TextInput, TextOutput]]:
    out: list[SampleEvaluationParams[TextInput, TextOutput]] = []
    grouped: dict[str, list[SampleEvaluationFunction[str]]] = {}
    for input_datum, eval_fn in test_suite:
        if input_datum not in grouped:
            grouped[input_datum] = []
        grouped[input_datum].append(eval_fn)

    all_inputs = list(grouped.keys())
    outputs = await asyncio.gather(
        *(run_aiconfig(config, TextInput(input_datum)) for input_datum in all_inputs)
    )

    # This zip is safe because we have defined an order for the keys in `all_inputs`
    # them apped run_aiconfig over that list.
    # Docs: https://docs.python.org/3/library/asyncio-task.html#running-tasks-concurrently
    #  > If all awaitables are completed successfully, the result is an aggregate list
    # of returned values. The order of result values corresponds to the order
    # of awaitables in aws.
    outputs_by_input = dict(zip(all_inputs, outputs))

    for input_datum, eval_fns in grouped.items():
        for eval_fn in eval_fns:
            out.append(
                SampleEvaluationParams(
                    input_sample=TextInput(input_datum),
                    output_sample=outputs_by_input[input_datum],
                    evaluation_fn=eval_fn,
                )
            )
    return out


def user_test_suite_outputs_only_to_eval_params_list(
    test_suite: UserTestSuiteOutputsOnly,
) -> Sequence[SampleEvaluationParams[TextInput, TextOutput]]:
    return [
        SampleEvaluationParams(
            input_sample=None,
            output_sample=TextOutput(output_datum),
            evaluation_fn=eval_fn,
        )
        for output_datum, eval_fn in test_suite
    ]


async def run_aiconfig_helper(
    aiconfig_path: str, prompt_name: str, question: str
) -> str:
    runtime = AIConfigRuntime.load(aiconfig_path)  # type: ignore[fixme, no-untyped-call]

    params = {
        "the_query": question,
    }

    result: Any = await runtime.run(prompt_name, params)  # type: ignore[fixme, no-untyped-call]
    final_output = runtime.get_output_text(prompt_name, result[0])  # type: ignore[fixme, no-untyped-call]
    return final_output


def check_substring(output_datum: str, substring: str, case_sensitive: bool) -> bool:
    if case_sensitive:
        return substring in output_datum
    else:
        return substring.lower() in output_datum.lower()


@dataclass(frozen=True)
class TestSuiteWithInputsSpec:
    test_suite: UserTestSuiteWithInputs
    config: TestSuiteWithInputsConfig


@dataclass(frozen=True)
class TestSuiteOutputsOnlySpec:
    test_suite: UserTestSuiteOutputsOnly


TestSuiteSpec = TestSuiteWithInputsSpec | TestSuiteOutputsOnlySpec


async def run_test_suite_helper(
    test_suite_spec: TestSuiteSpec,
) -> Result[pd.DataFrame, str]:
    async def _get_eval_params_list(
        test_suite_spec: TestSuiteSpec,
    ) -> Sequence[SampleEvaluationParams[TextInput, TextOutput]]:
        match test_suite_spec:
            case TestSuiteWithInputsSpec(test_suite=test_suite, config=config):
                return await user_test_suite_with_inputs_to_eval_params_list(
                    test_suite, config
                )
            case TestSuiteOutputsOnlySpec(test_suite=test_suite):
                return user_test_suite_outputs_only_to_eval_params_list(test_suite)

    eval_params_list = await _get_eval_params_list(test_suite_spec)
    eval_res = evaluate(eval_params_list)
    return eval_res.map(eval_res_to_df)
