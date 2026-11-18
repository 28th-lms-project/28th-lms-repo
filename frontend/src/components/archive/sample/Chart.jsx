/* 기록용 (archive): 표준화 전 모습을 남긴 코드. 새 코드에서 import 금지(lint로 막음) · 고치지 않음. 대체: 표준 없음 (가이드 6장 "표준을 만들지 않기로 한 것"). 안내: components/archive/README.md */
import { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

export const Chart = ({
                          type = "line",
                          height = 350,
                          series,
                          categories,
                          max = 100,
                          tickAmount = max / 10,
                          yText = "점수",
                      }) => {
    const chartRef = useRef(null);
    const chart = useRef(null);

    useEffect(() => {
        const options = {
            series,
            chart: {
                type,
                height,
            },
            plotOptions: {
                bar: {
                    // 공백 보기 싫을 때 true로 변경
                    hideZeroBarsWhenGrouped: false,
                    dataLabels: {
                        position: "top",
                    },
                },
            },
            dataLabels: {
                enabled: true,
                position: "top",
                style: {
                    colors: ["#333"],
                },
            },
            stroke: {
                show: true,
                width: [...series.map(() => 2)],
            },
            xaxis: {
                categories,
                labels: {
                    trim: true,
                },
            },
            yaxis: [
                {
                    min: 0,
                    max,
                    tickAmount,
                    logBase: 5,
                    title: {
                        text: yText,
                    },
                },
            ],
            fill: {
                opacity: 1,
            },
            marker: {
                show: true,
            },
            tooltip: {
                enabled: true,
                y: {
                    formatter: function (val) {
                        return `${val}점`;
                    },
                },
            },
            legend: {
                show: true,
                position: "right",
            },
        };

        if (!chart.current) {
            chart.current = new ApexCharts(chartRef.current, options);
            chart.current.render();
        }
    }, [height, type, categories, series, max, tickAmount, yText]);

    return (
        <div>
            <div ref={chartRef}></div>
        </div>
    );
};
