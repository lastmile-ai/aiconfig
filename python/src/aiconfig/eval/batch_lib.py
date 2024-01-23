import asyncio
import logging
from dataclasses import dataclass
from functools import partial
from typing import Any, Coroutine, Generic, Sequence, cast

import lastmile_utils.lib.core.api as core_utils
import pandas as pd
import result
from aiconfig.eval import batch_common, batch_metrics, common
from result import Result

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)

# Types


@dataclass(frozen=True)
class BatchEvalGeneralSettings:
    eval_fn_timeout_s: int = 5


@dataclass(frozen=True)
class EvaluableTableWithReference(
    Generic[common.T_Evaluable, batch_common.T_Ref]
):
    df: pd.DataFrame

    @staticmethod
    def make(
        # At this point, don't care about the type of input_data. It's display-only now.
        input_data: Sequence[Any] | None,
        evaluable: Sequence[common.T_Evaluable],
        ref_data: Sequence[batch_common.T_Ref],
    ) -> Result[
        "EvaluableTableWithReference[common.T_Evaluable, batch_common.T_Ref]",
        str,
    ]:
        # make_df is untyped, but it's safe to cast it here because the types are annotated in this function signature.
        # We can clearly see here that the output df types will match the input types, so it's safe to cast the output.
        df = common.make_df(
            {
                "input_data": input_data,
                "ref_data": ref_data,
                "evaluable": evaluable,
            }
        )
        out: Result[
            EvaluableTableWithReference[
                common.T_Evaluable, batch_common.T_Ref
            ],
            str,
        ] = cast(
            #
            Result[
                EvaluableTableWithReference[
                    common.T_Evaluable, batch_common.T_Ref
                ],
                str,
            ],
            df.map(EvaluableTableWithReference),
        )
        return out

    async def calculate(
        self,
        metric: batch_metrics.BatchMetricWithReference[
            common.T_Evaluable, batch_common.T_Ref, common.T_MetricValue
        ],
    ) -> Result["ResultTable[common.T_Evaluable, common.T_MetricValue]", str]:
        evaluable: Sequence[common.T_Evaluable] = cast(
            #
            Sequence[common.T_Evaluable],
            self.df.evaluable,  # type: ignore[pandas]
        )

        ref_data: Sequence[batch_common.T_Ref] = cast(
            #
            Sequence[batch_common.T_Ref],
            self.df.ref_data,  # type: ignore[pandas]
        )

        @core_utils.exception_to_err_with_traceback_async
        async def _run():
            return await metric.evaluation_fn(evaluable, ref_data)

        def _make(
            values_ok: list[common.T_MetricValue],
        ) -> Result[
            ResultTable[common.T_Evaluable, common.T_MetricValue], str
        ]:
            # safe annotation, we know what's in the df.
            out: Result[
                ResultTable[common.T_Evaluable, common.T_MetricValue], str
            ] = ResultTable.make(self.df, values_ok)
            return out

        values = await _run()
        out = values.and_then(_make)
        return out


@dataclass(frozen=True)
class EvaluableTableWithoutRef(Generic[common.T_Evaluable]):
    df: pd.DataFrame

    @staticmethod
    def make(
        # At this point, I don't care about the type of input_data. It's display-only now.
        input_data: Sequence[Any] | None,
        evaluable: Sequence[common.T_Evaluable],
    ) -> Result["EvaluableTableWithoutRef[common.T_Evaluable]", str]:
        # make_df is untyped, but it's safe to cast it here because the types are annotated in this function signature.
        # We can clearly see here that the output df types will match the input types, so it's safe to cast the output.
        df = common.make_df({"input_data": input_data, "evaluable": evaluable})
        out: Result[EvaluableTableWithoutRef[common.T_Evaluable], str] = cast(
            #
            Result[EvaluableTableWithoutRef[common.T_Evaluable], str],
            df.map(EvaluableTableWithoutRef),
        )
        return out

    async def calculate(
        self,
        metric: batch_metrics.BatchMetricWithoutReference[
            common.T_Evaluable, common.T_MetricValue
        ],
    ) -> Result["ResultTable[common.T_Evaluable, common.T_MetricValue]", str]:
        evaluable: Sequence[common.T_Evaluable] = cast(
            #
            Sequence[common.T_Evaluable],
            self.df.evaluable,  # type: ignore[pandas]
        )

        @core_utils.exception_to_err_with_traceback_async
        async def _run():
            return await metric.evaluation_fn(evaluable)

        def _make(
            values_ok: list[common.T_MetricValue],
        ) -> Result[
            ResultTable[common.T_Evaluable, common.T_MetricValue], str
        ]:
            # safe annotation, we know what's in the df.
            out: Result[
                ResultTable[common.T_Evaluable, common.T_MetricValue], str
            ] = ResultTable.make(self.df, values_ok)
            return out

        values = await _run()
        out = values.and_then(_make)
        return out


@dataclass(frozen=True)
class ResultTable(Generic[common.T_Evaluable, common.T_MetricValue]):
    df: pd.DataFrame

    @staticmethod
    def make(
        df_evaluable: pd.DataFrame,
        metric_values: Sequence[common.T_MetricValue],
    ) -> Result["ResultTable[common.T_Evaluable, common.T_MetricValue]", str]:
        if len(df_evaluable) != len(metric_values):
            return result.Err(
                f"len(df_evaluable) != len(metric_values): {len(df_evaluable)} != {len(metric_values)}"
            )
        else:
            return result.Ok(ResultTable(df_evaluable.assign(metric_values=metric_values)))  # type: ignore[pandas]

    @staticmethod
    def concatenate_tables(
        tables: Sequence[
            "ResultTable[common.T_Evaluable, common.T_MetricValue]"
        ],
    ) -> Result["ResultTable[common.T_Evaluable, common.T_MetricValue]", str]:
        dfs = [table.df for table in tables if len(table.df) > 0]
        df = pd.concat(dfs)  # type: ignore[pandas]
        return result.Ok(ResultTable(df))


# API


async def run_evaluation(
    #
    evaluable: Sequence[str],
    reference: Sequence[str] | None,
    metrics: batch_metrics.BatchMetrics[str, str, common.T_MetricValue],
    settings: BatchEvalGeneralSettings | None = None,
) -> pd.DataFrame:
    settings_ = settings or BatchEvalGeneralSettings()
    res_table = await _evaluable_to_result_table(
        None, evaluable, reference, metrics, settings_
    )
    return res_table.map(_process_result_table_to_df).unwrap_or_raise(
        ValueError
    )


async def _evaluable_to_result_table(
    # Intentional any. Inputs is display-only
    inputs: Sequence[Any] | None,
    evaluable: Sequence[str],
    reference: Sequence[str] | None,
    metrics: batch_metrics.BatchMetrics[str, str, common.T_MetricValue],
    settings: BatchEvalGeneralSettings,
):
    match metrics:
        case batch_metrics.BatchMetricsWithReference(metrics=metrics_):
            if not reference:
                raise ValueError(
                    "got BatchMetricsWithReference, reference cannot be None"
                )
            else:
                table = EvaluableTableWithReference.make(
                    inputs, evaluable, reference
                )
                res = await result.do_async(
                    #
                    await _run_evaluation_helper_with_ref(
                        table_ok, metrics_, settings
                    )
                    for table_ok in table
                )
                return res
        case batch_metrics.BatchMetricsWithoutReference(metrics=metrics_):
            if reference:
                raise ValueError(
                    "got BatchMetricsWithoutReference, reference must be None"
                )
            else:
                table = EvaluableTableWithoutRef.make(inputs, evaluable)
                res = await result.do_async(
                    #
                    await _run_evaluation_helper_without_ref(
                        table_ok, metrics_, settings
                    )
                    for table_ok in table
                )
                return res


async def run_aiconfig_and_evaluation(
    #
    aiconfig_path: str,
    prompt_name: str,
    aiconfig_params: Sequence[common.TextBasedInputDatum],
    reference: Sequence[str] | None,
    metrics: batch_metrics.BatchMetrics[str, str, common.T_MetricValue],
    settings: BatchEvalGeneralSettings | None = None,
) -> pd.DataFrame:
    settings_ = settings or BatchEvalGeneralSettings()
    evaluable = await _run_aiconfig_batch_helper(
        aiconfig_path, prompt_name, aiconfig_params
    )

    res_table = await result.do_async(
        await _evaluable_to_result_table(
            aiconfig_params, evaluable_ok, reference, metrics, settings_
        )
        for evaluable_ok in evaluable
    )
    return res_table.map(_process_result_table_to_df).unwrap_or_raise(
        ValueError
    )


# Implementation


async def _run_aiconfig_batch_helper(
    #
    aiconfig_path: str,
    prompt_name: str,
    params_seq: Sequence[common.TextBasedInputDatum],
) -> result.Result[list[common.TextOutput], str]:
    aiconfig = common.load_aiconfig_runtime(aiconfig_path)

    out = await result.do_async(
        await common.batch_run_aiconfig_on_text_based_input(
            #
            aiconfig_ok,
            prompt_name,
            params_seq,
        )
        for aiconfig_ok in aiconfig
    )
    return out


async def _run_evaluation_helper_with_ref(
    evaluable_with_ref: EvaluableTableWithReference[
        common.T_Evaluable, batch_common.T_Ref
    ],
    metrics: Sequence[
        batch_metrics.BatchMetricWithReference[
            common.T_Evaluable, batch_common.T_Ref, common.T_MetricValue
        ]
    ],
    settings: BatchEvalGeneralSettings,
) -> result.Result[ResultTable[common.T_Evaluable, common.T_MetricValue], str]:
    timeout_s = settings.eval_fn_timeout_s

    async def _calculate(
        metric: batch_metrics.BatchMetricWithReference[
            common.T_Evaluable, batch_common.T_Ref, common.T_MetricValue
        ],
    ):
        async def _thunk() -> Result[
            ResultTable[common.T_Evaluable, common.T_MetricValue], str
        ]:
            return await evaluable_with_ref.calculate(metric)

        values = await async_thunk_with_timeout(_thunk(), timeout_s=timeout_s)
        return values

    res = await core_utils.result_reduce_list_all_ok_async(
        map(
            partial(_calculate),
            metrics,
        )
    )

    match res:
        case result.Ok(res_):
            list_results = core_utils.result_reduce_list_all_ok(res_)
            match list_results:
                case result.Ok(list_results_ok):
                    all_results = ResultTable.concatenate_tables(
                        list_results_ok
                    )
                    return all_results
                case result.Err(err):
                    return result.Err(err)
        case result.Err(err):
            return result.Err(err)


async def _run_evaluation_helper_without_ref(
    evaluable_without_ref: EvaluableTableWithoutRef[common.T_Evaluable],
    metrics: Sequence[
        batch_metrics.BatchMetricWithoutReference[
            common.T_Evaluable, common.T_MetricValue
        ]
    ],
    settings: BatchEvalGeneralSettings,
) -> result.Result[ResultTable[common.T_Evaluable, common.T_MetricValue], str]:
    timeout_s = settings.eval_fn_timeout_s

    async def _calculate(
        metric: batch_metrics.BatchMetricWithoutReference[
            common.T_Evaluable, common.T_MetricValue
        ],
    ):
        async def _thunk() -> Result[
            ResultTable[common.T_Evaluable, common.T_MetricValue], str
        ]:
            return await evaluable_without_ref.calculate(metric)

        values = await async_thunk_with_timeout(_thunk(), timeout_s=timeout_s)
        return values

    res = await core_utils.result_reduce_list_all_ok_async(
        map(
            partial(_calculate),
            metrics,
        )
    )

    match res:
        case result.Ok(res_):
            list_results = core_utils.result_reduce_list_all_ok(res_)
            match list_results:
                case result.Ok(list_results_ok):
                    all_results = ResultTable.concatenate_tables(
                        list_results_ok
                    )
                    return all_results
                case result.Err(err):
                    return result.Err(err)
        case result.Err(err):
            return result.Err(err)


async def async_thunk_with_timeout(
    thunk: Coroutine[None, None, common.T_cov], timeout_s: int
) -> result.Result[common.T_cov, str]:
    task = asyncio.create_task(thunk)
    try:
        res = await asyncio.wait_for(task, timeout=timeout_s)
        return result.Ok(res)
    except asyncio.TimeoutError:
        task.cancel()
        return result.Err(
            f"async_thunk_with_timeout, {thunk.__name__} timed out after {timeout_s}s"
        )


def _process_result_table_to_df(eval_res: ResultTable[common.T_Evaluable, common.T_MetricValue]) -> pd.DataFrame:  # type: ignore[pandas untyped]
    raise NotImplementedError
