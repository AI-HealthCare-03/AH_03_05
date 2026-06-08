"""
동기 블로킹 vs 비동기 I/O 동시성 벤치마크.

PR #125에서 LLM 호출을 OpenAI -> AsyncOpenAI(await)로 전환했다.
당시 PR 설명은 "이벤트 루프 블로킹 제거, 동시 요청 처리 확보"였는데,
이 "블로킹 제거"가 실제로 어떤 처리량 차이를 만드는지 수치화한다.

[측정 대상]
LLM 호출처럼 I/O 대기(네트워크)가 지배적인 작업을 N건 동시에 처리할 때:
- 동기(블로킹): 한 요청의 I/O 대기 동안 이벤트 루프가 묶여 다음 요청이 대기
- 비동기(await): I/O 대기 중 다른 요청을 처리 -> 동시 진행

실제 OpenAI를 호출하지 않고 동일한 I/O 지연(sleep)으로 모사해
순수하게 '동시성 모델 차이'만 격리 측정한다. (비용 0, 재현 가능)

[사용법]
  uv run python experiments/async-benchmark/benchmark.py
"""

import asyncio
import time

IO_LATENCY = 0.3
REQUEST_COUNTS = [10, 50, 100]


def sync_llm_call() -> None:
    time.sleep(IO_LATENCY)


def run_sync(n: int) -> float:
    """N건을 동기로 순차 처리 (블로킹). 총 소요 시간 반환."""
    start = time.perf_counter()
    for _ in range(n):
        sync_llm_call()
    return time.perf_counter() - start


async def async_llm_call() -> None:
    await asyncio.sleep(IO_LATENCY)


async def run_async(n: int) -> float:
    """N건을 비동기로 동시 처리 (gather). 총 소요 시간 반환."""
    start = time.perf_counter()
    await asyncio.gather(*(async_llm_call() for _ in range(n)))
    return time.perf_counter() - start


def main() -> None:
    print("동기 블로킹 vs 비동기 I/O 동시성 벤치마크")
    print(f"(요청당 I/O 지연 {IO_LATENCY}s — LLM 호출 모사)\n")
    print(f"{'동시 요청':>8}{'동기(s)':>12}{'비동기(s)':>12}{'속도향상':>10}{'동기 처리량':>14}{'비동기 처리량':>16}")
    print("-" * 74)

    rows = []
    for n in REQUEST_COUNTS:
        t_sync = run_sync(n)
        t_async = asyncio.run(run_async(n))
        speedup = t_sync / t_async if t_async > 0 else 0
        tps_sync = n / t_sync
        tps_async = n / t_async
        rows.append((n, t_sync, t_async, speedup, tps_sync, tps_async))
        print(f"{n:>8}{t_sync:>12.2f}{t_async:>12.2f}{speedup:>9.1f}x{tps_sync:>13.1f}/s{tps_async:>15.1f}/s")

    print("-" * 74)
    print("\n해석:")
    print("- 동기: I/O 대기 동안 이벤트 루프가 블로킹되어 요청이 순차 처리됨 (시간 = N x 지연).")
    print("- 비동기: 대기 중 다른 요청을 처리해 N건이 사실상 동시에 진행됨 (시간 ~= 1건 지연).")
    n_max = REQUEST_COUNTS[-1]
    last = rows[-1]
    print(
        f"- 동시 {n_max}건 기준 처리 시간 {last[1]:.1f}s -> {last[2]:.2f}s, "
        f"약 {last[3]:.0f}배 향상. PR #125의 'AsyncOpenAI 전환으로 블로킹 제거'가 "
        f"이런 동시 처리량 차이로 나타난다."
    )


if __name__ == "__main__":
    main()
