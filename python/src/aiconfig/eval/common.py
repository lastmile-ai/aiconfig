import json
from abc import ABC
from dataclasses import dataclass
from typing import Any, Generic, NewType, Sequence, TypeVar

import lastmile_utils.lib.core.api as core_utils
import pandas as pd
from aiconfig.Config import AIConfigRuntime
from aiconfig.eval import common
from frozendict import frozendict
from result import Result

T_cov = TypeVar("T_cov", covariant=True)
U_cov = TypeVar("U_cov", covariant=True)

T_InputDatum = TypeVar("T_InputDatum", contravariant=True)
T_OutputDatum = TypeVar("T_OutputDatum", contravariant=True)


# NOTE: it's probably better to avoid NewType in the future, because it doesn't
# ... create a ... new type. For example, you can't pattern match against it.
TextOutput = NewType("TextOutput", str)


@dataclass(frozen=True)
class CustomMetricValue(ABC):
    """
    Subclass this if you want your metric to return a type not listed below
    (See the definition of T_MetricValue).
    See `metrics.py:TextSentimentScores` and `metrics.py:nltk_sentiment_scores_vader for an example.

    A subclass (an implementation of CustomMetricValue) can either be ordered or unordered.
    If ordered, it must implement the comparison operators <, <=, >, and >=.
    See TextOverallPositiveSentiment for example.
    See EvaluationMetricMetadata for more information about ordered metrics.
    """


T_Evaluable = TypeVar("T_Evaluable", contravariant=True)


T_MetricValue = TypeVar(
    "T_MetricValue", int, float, str, bool, CustomMetricValue, covariant=True
)
T_MetricValue_inv = TypeVar(
    "T_MetricValue_inv", int, float, str, bool, CustomMetricValue
)


class EvaluationMetricMetadata(
    core_utils.Record, Generic[common.T_Evaluable, common.T_MetricValue]
):

    """A record to tie together metadata about an evaluation metric
    to ensure that numbers are interpreted as intended.


    Assumptions:t
    * If the best and worst values are not None, then the metric is assumed to be ordered.
      In this case (if the metric is ordered) then the comparison operators <, <=, >, and >=
      must be implemented (see CustomMetricValue).
      If a metric is ordered, the domain is assumed to be a single closed interval or fully-ordered discrete set
      with one endpoint being the best possible value and
      the opposite endpoint the worst possible value.
    * Furthermore, if a metric is ordered, it is implicitly associated with a monotonic function of "goodness".
      That is, the metric either gets better along the entire domain, or worse along the entire domain.
      There are two cases: higher-is-better and lower-is-better.
    Examples:
        - Accuracy (higher-is-better): range = 0 -> 1. Worst score is 0, best is 1.
        0.1 is better than 0, 0.2 is better than 0.1, etc.
          Accuracy must fall between 0 and 1.
        - Error count (lower-is-better): range = 0 -> inf. Best score is 0, worst is inf.
        2 is worse than 1, 3 is worse than 2, etc.
          Error count must fall between 0 and inf.
    """

    @property
    def id(self) -> str:
        return core_utils.hash_id(
            f"{self.name}{self.description}{self.best_value}{self.worst_value}params={self._serialize_extra_metadata()}".encode(
                "utf-8"
            )
        )

    def _serialize_extra_metadata(self) -> str:
        return json.dumps(self.extra_metadata, sort_keys=True)

    name: str
    description: str
    best_value: common.T_MetricValue | None = None
    worst_value: common.T_MetricValue | None = None
    # e.g. {"substring": "hello", "case_sensitive": False}
    extra_metadata: dict[str, Any] = {}

    def __repr__(self) -> str:
        fields = self.__dict__
        fields["id"] = self.id
        s_json = json.dumps(fields, indent=2)
        return f"EvaluationMetricMetadata({s_json})"


@dataclass(frozen=True)
class TextBasedInputDatum:
    value: str | frozendict[str, str]


@core_utils.exception_to_err_with_traceback
def load_aiconfig_runtime(aiconfig_path: str) -> AIConfigRuntime:
    return AIConfigRuntime.load(aiconfig_path)


@core_utils.exception_to_err_with_traceback_async
async def run_aiconfig_get_output_text(
    aiconfig: AIConfigRuntime,
    prompt_name: str,
    params: dict[Any, Any],
    run_with_dependencies: bool,
):
    return await aiconfig.run_and_get_output_text(prompt_name, params, run_with_dependencies=run_with_dependencies)  # type: ignore


async def run_aiconfig_on_text_based_input(
    runtime: AIConfigRuntime,
    prompt_name: str,
    params: common.TextBasedInputDatum,
) -> Result[str, str]:
    def _get_params_for_aiconfig(
        params: common.TextBasedInputDatum,
    ) -> dict[str, str]:
        match params.value:
            case str(input_text):
                return {"the_query": input_text}
            case frozendict():
                return dict(params.value)

    params_for_aiconfig = _get_params_for_aiconfig(params)
    return await run_aiconfig_get_output_text(
        runtime, prompt_name, params_for_aiconfig, run_with_dependencies=True
    )


async def batch_run_aiconfig_on_text_based_input(
    aiconfig: AIConfigRuntime,
    prompt_name: str,
    params_seq: Sequence[common.TextBasedInputDatum],
) -> Result[list[TextOutput], str]:
    async def _run(
        input_datum: common.TextBasedInputDatum,
    ) -> Result[TextOutput, str]:
        return (
            await run_aiconfig_on_text_based_input(
                aiconfig, prompt_name, input_datum
            )
        ).map(TextOutput)

    # TODO: fix the race condition and then use gather
    # https://github.com/lastmile-ai/aiconfig/issues/434
    res_outputs_: list[Result[TextOutput, str]] = []
    for input_datum in params_seq:
        res_outputs_.append(await _run(input_datum))
    res_outputs = core_utils.result_reduce_list_all_ok(res_outputs_)
    # res_outputs = await core_utils.result_reduce_list_all_ok_async(list(map(_run, all_inputs)))

    return res_outputs


@core_utils.exception_to_err_with_traceback
def make_df(data: Any) -> pd.DataFrame:
    return pd.DataFrame(data)
