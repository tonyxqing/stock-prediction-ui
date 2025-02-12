import {
  AreaData,
  CandlestickData,
  ColorType,
  createChart,
  MouseEventParams,
  Time,
  WhitespaceData,
} from "lightweight-charts";
import React from "react";

const ChartComponent = (
  props: {
    updateLegend(param: MouseEventParams<Time>): void,
    candle?: boolean;
    data: (CandlestickData<Time> | AreaData<Time> | WhitespaceData<Time>)[];
    colors?:
      | {
          backgroundColor: string;
          lineColor: string;
          textColor: string;
          areaTopColor: string;
          areaBottomColor: string;
        }
      | undefined;
  } & React.ComponentProps<"div">
) => {
  const {
    data,
    colors: {
      backgroundColor = "white",
      lineColor = "#2962FF",
      textColor = "black",
      areaTopColor = "#2962FF",
      areaBottomColor = "rgba(41, 98, 255, 0.28)",
    } = {},
  } = props;

  const chartContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const chart = createChart(chartContainerRef.current!, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
        attributionLogo: false,
      },
      timeScale: {
        secondsVisible: true,
        timeVisible: true,
      },
      width: chartContainerRef.current!.clientWidth,
      height: 300,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    if (props.candle) {
      candlestickSeries.setData(data);
    } else {
      const newSeries = chart.addAreaSeries({
        lineColor,
        topColor: areaTopColor,
        bottomColor: areaBottomColor,
      });
      newSeries.setData(data);
    }
    chart.timeScale().fitContent();
    new ResizeObserver((entries) => {
      // console.log("entries", entries);
      if (
        entries.length === 0 ||
        entries[0].target !== chartContainerRef.current!
      ) {
        return;
      }
      const newRect = entries[0].contentRect;
      chart.applyOptions({ height: newRect.height, width: newRect.width });
    }).observe(chartContainerRef.current!);

    chart.subscribeCrosshairMove(props.updateLegend);
    return () => {
      chart.remove();
    };
  }, [
    data,
    backgroundColor,
    lineColor,
    textColor,
    areaTopColor,
    areaBottomColor,
    props.candle,
  ]);

  return <div className="flex overflow-hidden" ref={chartContainerRef}></div>;
};

export default ChartComponent;
