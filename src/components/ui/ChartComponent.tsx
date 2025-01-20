import {
  AreaData,
  ColorType,
  createChart,
  Time,
  WhitespaceData,
} from "lightweight-charts";
import React from "react";

const API_KEY_ID = "PKXZ1SPBPUHN8LVWM32Z";
const API_SECRET_KEY = "1oJOHfr38GeeutTku0eyg5r55zP80mbppafhOo2u";

const fetchStockData = () => {
  fetch(
    "https://data.alpaca.markets/v2/stocks/bars?symbols=AAPL&timeframe=1Min&start=2024-01-03T09%3A30%3A00-04%3A00&end=2024-01-04T09%3A30%3A00-04%3A00&limit=1000&adjustment=raw&feed=sip&sort=asc",
    {
      method: "GET",
      headers: {
        "APCA-API-KEY-ID": API_KEY_ID,
        "APCA-API-SECRET-KEY": API_SECRET_KEY,
      },
    }
  )
    .then((res) => res.text())
    .then((value) => console.log(value));
};
const streamStockData = () => {
  const ws = new WebSocket("wss://stream.data.alpaca.markets/v2/iex");

  ws.onopen = () => {
    console.log("open ws connection");

    const authMessage = {
      action: "auth",
      key: API_KEY_ID,
      secret: API_SECRET_KEY,
    };
    ws.send(JSON.stringify(authMessage));

    const listenMessage = {
      action: "subscribe",
      trades: ["AAPL"],
      quotes: ["AMD", "CLDR"],
      bars: ["*"],
    };
    ws.send(JSON.stringify(listenMessage));
  };
  ws.onmessage = (event) => {
    console.log(event);
    const message = event.data;

    // Check if the message is a Blob
    if (message instanceof Blob) {
      console.log("Received Blob data:", message);

      // Use FileReader to read the Blob as text or binary
      const reader = new FileReader();

      // Handle different types of data (e.g., text, JSON, binary)

      reader.onload = function (e) {
        const blobData = e.target!.result; // This is the decoded content
        console.log("Decoded Blob:", blobData);

        // If the Blob contains text (e.g., JSON or plain text)
        try {
          const jsonData = JSON.parse(blobData as string);
          console.log("Parsed JSON:", jsonData);
        } catch (error) {
          console.error("Failed to parse JSON:", error);
        }
      };
      reader.readAsText(message);
    } else {
      console.log("Received non-Blob message:", message);
    }
  };
  ws.onclose = () => {
    console.log("closed ws connection");
  };
  ws.onerror = (error) => {
    console.error("ws error", error);
  };
};
const ChartComponent = (props: {
  data: (AreaData<Time> | WhitespaceData<Time>)[];
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

  React.useEffect(() => {
    streamStockData();
    fetchStockData();
  }, []);
  const chartContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const chart = createChart(chartContainerRef.current!, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
        attributionLogo: false,
      },
      width: chartContainerRef.current!.clientWidth,
      height: 300,
    });
    chart.timeScale().fitContent();

    const newSeries = chart.addAreaSeries({
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
    });
    newSeries.setData(data);
    new ResizeObserver((entries) => {
      console.log("entries", entries);
      if (
        entries.length === 0 ||
        entries[0].target !== chartContainerRef.current!
      ) {
        return;
      }
      const newRect = entries[0].contentRect;
      console.log(newRect);
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
