from abc import abstractmethod
from typing import Protocol, Sequence, TypeVar


from aiconfig.eval import common
from aiconfig.eval import batch_common


T_Ref = TypeVar("T_Ref")
T_Ref_contra = TypeVar("T_Ref_contra", contravariant=True)


class BatchEvaluationFunctionWithReference(Protocol[common.T_Evaluable, batch_common.T_Ref_contra, common.T_MetricValue_inv]):
    @abstractmethod
    async def __call__(self, data: Sequence[common.T_Evaluable], ref: Sequence[batch_common.T_Ref_contra]) -> list[common.T_MetricValue_inv]:
        pass


class BatchEvaluationFunctionWithoutReference(Protocol[common.T_Evaluable, common.T_MetricValue_inv]):
    @abstractmethod
    async def __call__(self, data: Sequence[common.T_Evaluable]) -> list[common.T_MetricValue_inv]:
        pass
