import asyncio
import json
import logging
from dataclasses import dataclass
from functools import partial
from typing import Any, Generic, NewType, Sequence, Tuple, TypeVar

import aiconfig.eval.common as common
import aiconfig.eval.test_suite_common as test_suite_common
import lastmile_utils.lib.core.api as core_utils
import pandas as pd
from aiconfig.Config import AIConfigRuntime
from aiconfig.eval.test_suite_metrics import TestSuiteMetric
from frozendict import frozendict
from result import Err, Ok, Result

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)


# TODO: figure out a way to do heterogenous list without Any
# Each test is a (input_datum, TestSuiteMetric) pair
UserTestSuiteWithInputs = Sequence[
    Tuple[str | dict[str, str], TestSuiteMetric[str, Any]]
]

# Each test is a (output_datum, TestSuiteMetric) pair
UserTestSuiteOutputsOnly = Sequence[Tuple[str, TestSuiteMetric[str, Any]]]


# NOTE: it's probably better to avoid NewType in the future, because it doesn't
# ... create a ... new type. For example, you can't pattern match against it.
TextOutput = NewType("TextOutput", str)


@dataclass(frozen=True)
class TextBasedInputDatum:
    value: str | frozendict[str, str]


@dataclass(frozen=True)
class TestSuiteGeneralSettings:
    eval_fn_timeout_s: int = 5


class TestSuiteWithInputsSettings(core_utils.Record):
    prompt_name: str
    aiconfig_path: str
    general_settings: TestSuiteGeneralSettings = TestSuiteGeneralSettings()


class TestSuiteOutputsOnlySettings(core_utils.Record):
    general_settings: TestSuiteGeneralSettings = TestSuiteGeneralSettings()


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
            general_settings=settings.general_settings,
        )
    )
    return res.map(text_eval_res_to_df).unwrap_or_raise(ValueError)


async def run_test_suite_outputs_only(
    test_suite: UserTestSuiteOutputsOnly,
    settings: TestSuiteOutputsOnlySettings = TestSuiteOutputsOnlySettings(),
) -> pd.DataFrame:
    res = await run_test_suite_helper(
        TestSuiteOutputsOnlySpec(
            test_suite=test_suite, general_settings=settings.general_settings
        )
    )
    return res.map(text_eval_res_to_df).unwrap_or_raise(ValueError)


T = TypeVar("T")


class NumericalEvalDataset(core_utils.Record):
    output: Sequence[float | int]
    ground_truth: Sequence[float | int]


# TODO:
# GenericBeforeBaseModelWarning: Classes should inherit from `BaseModel` before generic classes (e.g. `typing.Generic[T]`) for pydantic generics to work properly.
# But swapping the order breaks
class SampleEvaluationResult(
    Generic[common.T_InputDatum, common.T_OutputDatum, common.T_MetricValue],
    core_utils.Record,
):
    input_datum: common.T_InputDatum | None
    output_datum: common.T_OutputDatum
    metric_value: test_suite_common.SampleMetricValue[
        common.T_OutputDatum, common.T_MetricValue
    ]


@dataclass(frozen=True)
class SampleEvaluationParams(
    Generic[common.T_InputDatum, common.T_OutputDatum, common.T_MetricValue]
):
    # input_sample doesn't _need_ to be here, because we already have
    # output_sample ready to input to eval.
    # input_sample is here for documentation/debugging.
    input_sample: common.T_InputDatum | None
    output_sample: common.T_OutputDatum
    metric: TestSuiteMetric[common.T_OutputDatum, common.T_MetricValue]

    def __str__(self) -> str:
        return f"\nSampleEvaluationParams:\n\t{self.output_sample=}\n\t{self.metric=}"


# TODO: don't use Any.
DatasetEvaluationResult = Sequence[
    SampleEvaluationResult[common.T_InputDatum, common.T_OutputDatum, Any]
]
DatasetEvaluationParams = Sequence[
    SampleEvaluationParams[common.T_InputDatum, common.T_OutputDatum, Any]
]
MetricList = list[TestSuiteMetric[common.T_OutputDatum, Any]]


async def _evaluate_for_sample(
    eval_params: SampleEvaluationParams[
        common.T_InputDatum, common.T_OutputDatum, common.T_MetricValue
    ],
    timeout_s: int,
) -> SampleEvaluationResult[
    common.T_InputDatum, common.T_OutputDatum, common.T_MetricValue
]:
    sample, metric = (
        eval_params.output_sample,
        eval_params.metric,
    )

    async def _calculate() -> common.T_MetricValue:
        return await metric.evaluation_fn(sample)

    def _ok_with_log(
        res_: Result[common.T_MetricValue, str]
    ) -> common.T_MetricValue | None:
        match res_:
            case Ok(res):
                return res
            case Err(e):
                LOGGER.error(f"Error evaluating {eval_params=}: {e}")
                return None

    res_ = await core_utils.run_thunk_safe(_calculate(), timeout=timeout_s)
    result = SampleEvaluationResult(
        input_datum=eval_params.input_sample,
        output_datum=sample,
        metric_value=test_suite_common.SampleMetricValue(
            #
            value=_ok_with_log(res_),
            metric_metadata=metric.metric_metadata,
        ),
    )
    return result


async def evaluate(
    evaluation_params_list: DatasetEvaluationParams[
        common.T_InputDatum, common.T_OutputDatum
    ],
    eval_fn_timeout_s: int,
) -> Result[
    DatasetEvaluationResult[common.T_InputDatum, common.T_OutputDatum], str
]:
    return Ok(
        await asyncio.gather(
            *map(
                partial(_evaluate_for_sample, timeout_s=eval_fn_timeout_s),
                evaluation_params_list,
            )
        )
    )


def text_eval_res_to_df(
    eval_res: DatasetEvaluationResult[TextBasedInputDatum, TextOutput],
) -> pd.DataFrame:
    def _extract_text_based_input_for_display(
        eval_res: DatasetEvaluationResult[TextBasedInputDatum, TextOutput],
    ) -> DatasetEvaluationResult[str, TextOutput]:
        def _extract_value(
            input_text_datum: TextBasedInputDatum | None,
        ) -> str | None:
            if input_text_datum is None:
                return None
            else:
                match input_text_datum.value:
                    case str(input_text):
                        return input_text
                    case frozendict():
                        return json.dumps(
                            input_text_datum.value, sort_keys=True
                        )

        return [
            SampleEvaluationResult(
                input_datum=_extract_value(sample_res.input_datum),
                output_datum=sample_res.output_datum,
                metric_value=sample_res.metric_value,
            )
            for sample_res in eval_res
        ]

    with_text_extracted = _extract_text_based_input_for_display(eval_res)
    # TODO: dont use Any
    records: list[dict[str, Any]] = []
    for sample_res in with_text_extracted:
        records.append(
            dict(
                input=sample_res.input_datum,
                aiconfig_output=sample_res.output_datum,
                value=sample_res.metric_value.value,
                metric_id=sample_res.metric_value.metric_metadata.id,
                metric_name=sample_res.metric_value.metric_metadata.name,
                metric_description=sample_res.metric_value.metric_metadata.description,
                best_possible_value=sample_res.metric_value.metric_metadata.best_value,
                worst_possible_value=sample_res.metric_value.metric_metadata.worst_value,
            )
        )
    df = pd.DataFrame.from_records(records)  # type: ignore[no-untyped-call]
    if len(df) == 0:
        return df
    for c in ["input", "aiconfig_output", "metric_name", "metric_description"]:
        df[c] = df[c].astype("string").fillna("Missing")  # type: ignore[no-untyped-call]

    return df


async def user_test_suite_with_inputs_to_eval_params_list(
    test_suite: UserTestSuiteWithInputs,
    prompt_name: str,
    aiconfig: AIConfigRuntime,
) -> Result[DatasetEvaluationParams[TextBasedInputDatum, TextOutput], str]:
    """
    Example in/out:
        [("hello", brevity)] -> [SampleEvaluationParams("hello", "output_is_world", brevity)]
    """

    def _user_test_input_to_internal_type(
        input_datum_user_given: str | dict[str, str]
    ) -> TextBasedInputDatum:
        match input_datum_user_given:
            case str(input_datum):
                return TextBasedInputDatum(input_datum)
            case dict(input_datum):
                return TextBasedInputDatum(frozendict(input_datum))

    test_suite_internal_types = [
        (_user_test_input_to_internal_type(input_datum), TestSuiteMetric)
        for input_datum, TestSuiteMetric in test_suite
    ]

    out: DatasetEvaluationParams[TextBasedInputDatum, TextOutput] = []

    # Group by input so that we only run each input through the AIConfig once.
    # This is sort of an optimization because the user can give the same input
    # multiple times (with different TestSuiteMetrics).
    input_to_metrics_mapping: dict[
        TextBasedInputDatum, MetricList[TextOutput]
    ] = {}
    for input_datum, metric in test_suite_internal_types:
        if input_datum not in input_to_metrics_mapping:
            input_to_metrics_mapping[input_datum] = []
        input_to_metrics_mapping[input_datum].append(metric)

    all_inputs = list(input_to_metrics_mapping.keys())

    async def _run(
        input_datum: TextBasedInputDatum,
    ) -> Result[TextOutput, str]:
        return (
            await run_aiconfig_on_text_based_input(
                aiconfig, prompt_name, input_datum
            )
        ).map(TextOutput)

    # TODO: fix the race condition and then use gather
    # https://github.com/lastmile-ai/aiconfig/issues/434
    res_outputs_: list[Result[TextOutput, str]] = []
    for input_datum in all_inputs:
        res_outputs_.append(await _run(input_datum))
    res_outputs = core_utils.result_reduce_list_all_ok(res_outputs_)
    # res_outputs = await core_utils.result_reduce_list_all_ok_async(list(map(_run, all_inputs)))

    def _zip_inputs_outputs(outputs: list[TextOutput]):
        # This zip is safe because we have defined an order for the keys in `all_inputs`
        # them apped run_aiconfig over that list.
        # Docs: https://docs.python.org/3/library/asyncio-task.html#running-tasks-concurrently
        #  > If all awaitables are completed successfully, the result is an aggregate list
        # of returned values. The order of result values corresponds to the order
        # of awaitables in aws.
        outputs_by_input = dict(zip(all_inputs, outputs))

        for input_datum, TestSuiteMetrics in input_to_metrics_mapping.items():
            for metric in TestSuiteMetrics:
                out.append(
                    SampleEvaluationParams(
                        input_sample=input_datum,
                        output_sample=outputs_by_input[input_datum],
                        metric=metric,
                    )
                )
        return out

    return res_outputs.map(_zip_inputs_outputs)


def user_test_suite_outputs_only_to_eval_params_list(
    test_suite: UserTestSuiteOutputsOnly,
) -> DatasetEvaluationParams[TextBasedInputDatum, TextOutput]:
    """
    Example: [("the_output_is_world", brevity)] -> [SampleEvaluationParams(None, "the_output_is_world", brevity)
    """
    return [
        SampleEvaluationParams(
            input_sample=None,
            output_sample=TextOutput(output_datum),
            metric=metric,
        )
        for output_datum, metric in test_suite
    ]


async def run_aiconfig_on_text_based_input(
    runtime: AIConfigRuntime, prompt_name: str, params: TextBasedInputDatum
) -> Result[str, str]:
    def _get_params_for_aiconfig(
        params: TextBasedInputDatum,
    ) -> dict[str, str]:
        match params.value:
            case str(input_text):
                return {"the_query": input_text}
            case frozendict():
                return dict(params.value)

    params_for_aiconfig = _get_params_for_aiconfig(params)
    return await common.run_aiconfig_get_output_text(
        runtime, prompt_name, params_for_aiconfig, run_with_dependencies=True
    )


@dataclass(frozen=True)
class TestSuiteWithInputsSpec:
    test_suite: UserTestSuiteWithInputs
    prompt_name: str
    aiconfig: AIConfigRuntime
    general_settings: TestSuiteGeneralSettings


@dataclass(frozen=True)
class TestSuiteOutputsOnlySpec:
    test_suite: UserTestSuiteOutputsOnly
    general_settings: TestSuiteGeneralSettings


TestSuiteSpec = TestSuiteWithInputsSpec | TestSuiteOutputsOnlySpec


async def run_test_suite_helper(
    test_suite_spec: TestSuiteSpec,
) -> Result[DatasetEvaluationResult[TextBasedInputDatum, TextOutput], str]:
    async def _get_eval_params_list(
        test_suite_spec: TestSuiteSpec,
    ) -> Result[DatasetEvaluationParams[TextBasedInputDatum, TextOutput], str]:
        match test_suite_spec:
            case TestSuiteWithInputsSpec(
                test_suite=test_suite,
                prompt_name=prompt_name,
                aiconfig=aiconfig,
            ):
                return await user_test_suite_with_inputs_to_eval_params_list(
                    test_suite, prompt_name, aiconfig
                )
            case TestSuiteOutputsOnlySpec(test_suite=test_suite):
                return Ok(
                    user_test_suite_outputs_only_to_eval_params_list(
                        test_suite
                    )
                )

    eval_params_list = await _get_eval_params_list(test_suite_spec)

    async def _evaluate_with_timeout(
        eval_params_list: DatasetEvaluationParams[
            TextBasedInputDatum, TextOutput
        ],
    ) -> Result[DatasetEvaluationResult[TextBasedInputDatum, TextOutput], str]:
        return await evaluate(
            eval_params_list,
            eval_fn_timeout_s=test_suite_spec.general_settings.eval_fn_timeout_s,
        )

    res_evaluated = await eval_params_list.and_then_async(
        _evaluate_with_timeout
    )
    return res_evaluated
