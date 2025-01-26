import { BandsIndicator } from "@/app/bands-indicator";
import {
  AreaData,
  CandlestickData,
  ColorType,
  createChart,
  Time,
  WhitespaceData,
} from "lightweight-charts";
import React from "react";

const ChartComponent = (props: {
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
}) => {
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
    const bandIndicator = new BandsIndicator({});

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    if (props.candle) {
      candlestickSeries.setData(data);
      // candlestickSeries.attachPrimitive(bandIndicator);
    } else {
      const newSeries = chart.addAreaSeries({
        lineColor,
        topColor: areaTopColor,
        bottomColor: areaBottomColor,
      });
      newSeries.setData(data);
      newSeries.attachPrimitive(bandIndicator);
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
      // console.log(newRect);
      chart.applyOptions({ height: newRect.height, width: newRect.width });
    }).observe(chartContainerRef.current!);

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
  ]);

  return <div className="flex overflow-hidden" ref={chartContainerRef} />;
};

export default ChartComponent;
