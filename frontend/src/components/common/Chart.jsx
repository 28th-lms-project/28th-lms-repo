import { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

/**
 * 공통 차트 (apexcharts). sample/Chart.jsx 를 기반으로 다음을 고쳤다.
 * - 데이터(series · categories 등)가 바뀌면 차트를 다시 그린다. (샘플은 처음 한 번만 그림)
 * - 컴포넌트가 사라질 때 chart.destroy() 로 정리한다.
 *
 * 주의: series · categories 는 useMemo 로 만들어 넘길 것.
 *       렌더링마다 새 배열을 넘기면 그때마다 차트를 새로 그린다.
 *
 * props
 * - type: "line" | "bar" 등 apexcharts 차트 유형
 * - series: [{ name, data: [숫자...] }]
 * - categories: x축 이름 목록 (series.data 와 같은 순서)
 * - max: y축 최대값, tickAmount: y축 눈금 수
 * - yText: y축 제목, unit: 툴팁 · 데이터 라벨 단위 (예: "점", "%")
 */
export default function Chart({
  type = "line",
  height = 350,
  series,
  categories,
  max = 100,
  tickAmount = 10,
  yText = "점수",
  unit = "점",
}) {
  const chartRef = useRef(null);

  useEffect(() => {
    const formatDataLabel = (value) => {
      if (value === null || value === undefined) {
        return "";
      }
      return `${value}${unit}`;
    };

    const formatTooltipValue = (value) => {
      if (value === null || value === undefined) {
        return "-";
      }
      return `${value}${unit}`;
    };

    const options = {
      series,
      chart: {
        type,
        height,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          hideZeroBarsWhenGrouped: false,
          dataLabels: {
            position: "top",
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: formatDataLabel,
        style: {
          colors: ["#333"],
        },
      },
      stroke: {
        show: true,
        width: series.map(() => 2),
      },
      xaxis: {
        categories,
        labels: {
          trim: true,
        },
      },
      yaxis: {
        min: 0,
        max,
        tickAmount,
        title: {
          text: yText,
        },
      },
      fill: {
        opacity: 1,
      },
      markers: {
        size: 4,
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: formatTooltipValue,
        },
      },
      legend: {
        show: true,
        position: "right",
      },
    };

    // 데이터가 바뀔 때마다 새로 만들고, 이전 차트는 정리 함수에서 지운다.
    // (StrictMode 에서 두 번 마운트돼도 차트가 겹치지 않음)
    const chart = new ApexCharts(chartRef.current, options);
    chart.render();

    return () => {
      chart.destroy();
    };
  }, [type, height, series, categories, max, tickAmount, yText, unit]);

  return <div ref={chartRef}></div>;
}
