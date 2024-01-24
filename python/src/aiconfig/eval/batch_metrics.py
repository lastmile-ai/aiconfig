from dataclasses import dataclass
from typing import Generic, Sequence

from aiconfig.eval import batch_common, common


@dataclass(frozen=True)
class BatchMetricWithReference(
    Generic[common.T_Evaluable, batch_common.T_Ref, common.T_MetricValue]
):
    """See metrics.py for examples."""

    evaluation_fn: batch_common.BatchEvaluationFunctionWithReference[
        common.T_Evaluable, batch_common.T_Ref, common.T_MetricValue
    ]
    metric_metadata: common.EvaluationMetricMetadata[
        common.T_Evaluable, common.T_MetricValue
    ]

    async def __call__(
        self,
        data: Sequence[common.T_Evaluable],
        ref: Sequence[batch_common.T_Ref],
    ) -> list[common.T_MetricValue]:
        """
        For convenience, make a Metric callable.
        Similar to torch Module `forward()`.
        """
        return await self.evaluation_fn(data, ref)


@dataclass(frozen=True)
class BatchMetricWithoutReference(
    Generic[common.T_Evaluable, common.T_MetricValue]
):
    """See metrics.py for examples."""

    evaluation_fn: batch_common.BatchEvaluationFunctionWithoutReference[
        common.T_Evaluable, common.T_MetricValue
    ]
    metric_metadata: common.EvaluationMetricMetadata[
        common.T_Evaluable, common.T_MetricValue
    ]

    async def __call__(
        self, data: Sequence[common.T_Evaluable]
    ) -> list[common.T_MetricValue]:
        """
        For convenience, make a Metric callable.
        Similar to torch Module `forward()`.
        """
        return await self.evaluation_fn(data)


@dataclass
class BatchMetricsWithReference(
    Generic[common.T_Evaluable, batch_common.T_Ref, common.T_MetricValue]
):
    metrics: Sequence[
        BatchMetricWithReference[
            common.T_Evaluable, batch_common.T_Ref, common.T_MetricValue
        ]
    ]


@dataclass
class BatchMetricsWithoutReference(
    Generic[common.T_Evaluable, common.T_MetricValue]
):
    metrics: Sequence[
        BatchMetricWithoutReference[common.T_Evaluable, common.T_MetricValue]
    ]


BatchMetrics = (
    BatchMetricsWithReference[
        common.T_Evaluable, batch_common.T_Ref, common.T_MetricValue
    ]
    | BatchMetricsWithoutReference[common.T_Evaluable, common.T_MetricValue]
)
