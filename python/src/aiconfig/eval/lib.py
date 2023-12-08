import logging
from dataclasses import dataclass
from typing import Generic, NewType, Sequence, Tuple, TypeVar

import lastmile_utils.lib.core.api as cu
import pandas as pd
from aiconfig.Config import AIConfigRuntime
from result import Ok, Result

from aiconfig.eval.common import (
    Metric,
    SampleMetricValue,
    T_InputDatum,
    T_OutputDatum,
)

logging.basicConfig(format=cu.LOGGER_FMT)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


# Each test is a (input_datum, evaluation_fn) pair
UserTestSuiteWithInputs = Sequence[Tuple[str, Metric[str]]]

# Each test is a (output_datum, evaluation_fn) pair
UserTestSuiteOutputsOnly = Sequence[Tuple[str, Metric[str]]]


class TestSuiteWithInputsSettings(cu.Record):
    prompt_name: str
    aiconfig_path: str


async def run_test_suite_with_inputs(
    test_suite: UserTestSuiteWithInputs,
    settings: TestSuiteWithInputsSettings,
) -> pd.DataFrame:
    aiconfig = AIConfigRuntime.load(settings.aiconfig_path)  # type: ignore[fixme, no-untyped-call]
    res = await run_test_suite_helper(
        TestSuiteWithInputsSpec(
            test_suite=test_suite,
            prompt_name=settings.prompt_name,
            aiconfig=aiconfig,
        )
    )
    return res.unwrap_or_raise(ValueError)


async def run_test_suite_outputs_only(
    test_suite: UserTestSuiteOutputsOnly,
) -> pd.DataFrame:
    res = await run_test_suite_helper(TestSuiteOutputsOnlySpec(test_suite=test_suite))
    return res.unwrap_or_raise(ValueError)


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
    metric: Metric[T_OutputDatum]

    def __str__(self) -> str:
        return f"\nSampleEvaluationParams:\n\t{self.output_sample=}\n\t{self.metric=}"


def evaluate(
    evaluation_params_list: Sequence[
        SampleEvaluationParams[T_InputDatum, T_OutputDatum]
    ],
) -> Result[
    DatasetEvaluationResult[T_InputDatum, T_OutputDatum], str
]:  # pyright: ignore[fixme, reportInvalidTypeVarUse]
    results: Sequence[SampleEvaluationResult[T_InputDatum, T_OutputDatum]] = []

    for eval_params in evaluation_params_list:
        sample, metric = (
            eval_params.output_sample,
            eval_params.metric,
        )
        evaluation_fn = metric.calculate
        res_ = evaluation_fn(sample)
        logger.debug(f"{res_=}")
        result = SampleEvaluationResult(
            input_datum=eval_params.input_sample,
            output_datum=sample,
            metric_value=SampleMetricValue(
                value=res_, interpretation=metric.interpretation
            ),
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
                metric_id=sample_res.metric_value.interpretation.id,
                metric_name=sample_res.metric_value.interpretation.name,
                metric_description=sample_res.metric_value.interpretation.description,
                best_possible_value=sample_res.metric_value.interpretation.best_value,
                worst_possible_value=sample_res.metric_value.interpretation.worst_value,
            )
        )
    df = pd.DataFrame.from_records(records)  # type: ignore[no-untyped-call]
    if len(df) == 0:
        return df
    for c in ["input", "aiconfig_output", "metric_name", "metric_description"]:
        df[c] = df[c].astype("string").fillna("Missing")  # type: ignore[no-untyped-call]

    return df


async def user_test_suite_with_inputs_to_eval_params_list(
    test_suite: UserTestSuiteWithInputs, prompt_name: str, aiconfig: AIConfigRuntime
) -> Result[Sequence[SampleEvaluationParams[TextInput, TextOutput]], str]:
    out: list[SampleEvaluationParams[TextInput, TextOutput]] = []
    grouped: dict[str, list[Metric[str]]] = {}
    for input_datum, metric in test_suite:
        if input_datum not in grouped:
            grouped[input_datum] = []
        grouped[input_datum].append(metric)

    all_inputs = list(grouped.keys())

    async def _run(input_datum: str) -> Result[TextOutput, str]:
        return (await run_aiconfig_helper(aiconfig, prompt_name, input_datum)).map(
            TextOutput
        )

    # TODO: fix the race condition and then use gather
    # https://github.com/lastmile-ai/aiconfig/issues/434
    res_outputs_: list[Result[TextOutput, str]] = []
    for input_datum in all_inputs:
        res_outputs_.append(await _run(input_datum))
    res_outputs = cu.result_reduce_list_all_ok(res_outputs_)
    # res_outputs = await cu.result_reduce_list_all_ok_async(list(map(_run, all_inputs)))

    def _zip_inputs_outputs(outputs: list[TextOutput]):
        # This zip is safe because we have defined an order for the keys in `all_inputs`
        # them apped run_aiconfig over that list.
        # Docs: https://docs.python.org/3/library/asyncio-task.html#running-tasks-concurrently
        #  > If all awaitables are completed successfully, the result is an aggregate list
        # of returned values. The order of result values corresponds to the order
        # of awaitables in aws.
        outputs_by_input = dict(zip(all_inputs, outputs))

        for input_datum, metrics in grouped.items():
            for metric in metrics:
                out.append(
                    SampleEvaluationParams(
                        input_sample=TextInput(input_datum),
                        output_sample=outputs_by_input[input_datum],
                        metric=metric,
                    )
                )
        return out

    return res_outputs.map(_zip_inputs_outputs)


def user_test_suite_outputs_only_to_eval_params_list(
    test_suite: UserTestSuiteOutputsOnly,
) -> Sequence[SampleEvaluationParams[TextInput, TextOutput]]:
    return [
        SampleEvaluationParams(
            input_sample=None, output_sample=TextOutput(output_datum), metric=metric
        )
        for output_datum, metric in test_suite
    ]


async def run_aiconfig_helper(
    runtime: AIConfigRuntime, prompt_name: str, question: str
) -> Result[str, str]:
    params = {
        "the_query": question,
    }

    try:
        out = Ok(await runtime.run_and_get_output_text(prompt_name, params, run_with_dependencies=True))  # type: ignore[fixme, no-untyped-call]
        return out
    except Exception as e:
        return cu.ErrWithTraceback(e)


@dataclass(frozen=True)
class TestSuiteWithInputsSpec:
    test_suite: UserTestSuiteWithInputs
    prompt_name: str
    aiconfig: AIConfigRuntime


@dataclass(frozen=True)
class TestSuiteOutputsOnlySpec:
    test_suite: UserTestSuiteOutputsOnly


TestSuiteSpec = TestSuiteWithInputsSpec | TestSuiteOutputsOnlySpec


async def run_test_suite_helper(
    test_suite_spec: TestSuiteSpec,
) -> Result[pd.DataFrame, str]:
    async def _get_eval_params_list(
        test_suite_spec: TestSuiteSpec,
    ) -> Result[Sequence[SampleEvaluationParams[TextInput, TextOutput]], str]:
        match test_suite_spec:
            case TestSuiteWithInputsSpec(
                test_suite=test_suite, prompt_name=prompt_name, aiconfig=aiconfig
            ):
                return await user_test_suite_with_inputs_to_eval_params_list(
                    test_suite, prompt_name, aiconfig
                )
            case TestSuiteOutputsOnlySpec(test_suite=test_suite):
                return Ok(user_test_suite_outputs_only_to_eval_params_list(test_suite))

    eval_params_list = await _get_eval_params_list(test_suite_spec)
    return eval_params_list.and_then(evaluate).map(eval_res_to_df)
