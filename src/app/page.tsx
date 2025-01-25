"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ChartComponent from "@/components/ui/ChartComponent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CandlestickData, Time, UTCTimestamp } from "lightweight-charts";
import React from "react";

const API_KEY_ID = "";
const API_SECRET_KEY = "";
const fetchStockData = (symbols: string, timeframe: string, start: string, end: string) => {
  return fetch(
    `https://data.alpaca.markets/v2/stocks/bars?symbols=${symbols}&timeframe=${timeframe}&start=${start}&end=${end}&limit=1000&adjustment=raw&feed=sip&sort=asc`,
    {
      method: "GET",
      headers: {
        "APCA-API-KEY-ID": API_KEY_ID,
        "APCA-API-SECRET-KEY": API_SECRET_KEY,
      },
    }
  )
    .then((res) => res.text())
    .then((value) => JSON.parse(value))
    .catch((error) => {
      console.error(error);
      throw error;
    });
};
const streamStockData = () => {
  const ws = new WebSocket("wss://stream.data.alpaca.markets/v2/iex");

  ws.onopen = () => {
    const authMessage = {
      action: "auth",
      key: API_KEY_ID,
      secret: API_SECRET_KEY,
    };
    ws.send(JSON.stringify(authMessage));

    const listenMessage = {
      action: "subscribe",
      trades: ["AAPL"],
    };
    ws.send(JSON.stringify(listenMessage));
  };
  ws.onmessage = (event) => {
    const message = event.data;
    if (message instanceof Blob) {
      const reader = new FileReader();
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
      console.log("Received non-Blob message:", JSON.parse(message));
    }
  };
  ws.onclose = () => {
    console.log("closed ws connection");
  };
  ws.onerror = (error) => {
    console.error("ws error", error);
  };
  return ws;
};
export default function Home() {
  const [fart, setFart] = React.useState<CandlestickData<Time>>();
  React.useEffect(() => {
    const ws = streamStockData();
    fetchStockData().then((data) =>
      setFart(
        data.bars.AAPL.map(({ o, h, l, c, t }) => {
          const date = new Date(t);
          const time = date.getTime() / 1000 as UTCTimestamp;
          return {
            open: o,
            high: h,
            low: l,
            close: c,
            time,
          };
        })
      )
    );
    return () => {
      ws.close();
    };
  }, []);
  const initialData = [
    { time: "2019-04-11", value: 80.01 },
    { time: "2019-04-12", value: 96.63 },
    { time: "2019-04-13", value: 76.64 },
    { time: "2019-04-14", value: 81.89 },
    { time: "2019-04-15", value: 74.43 },
    { time: "2019-04-16", value: 80.01 },
    { time: "2019-04-17", value: 96.63 },
    { time: "2019-04-18", value: 76.64 },
    { time: "2019-04-19", value: 81.89 },
    { time: "2019-04-20", value: 74.43 },
  ];
  const candleData = [
    { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },
    { open: 9.55, high: 10.3, low: 9.42, close: 9.94, time: 1642514276 },
    { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 },
    { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 },
    { open: 9.51, high: 10.46, low: 9.1, close: 10.17, time: 1642773476 },
    { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 },
    { open: 10.47, high: 11.39, low: 10.4, close: 10.81, time: 1642946276 },
    { open: 10.81, high: 11.6, low: 10.3, close: 10.75, time: 1643032676 },
    { open: 10.75, high: 11.6, low: 10.49, close: 10.93, time: 1643119076 },
    { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 },
  ];
  return (
    <div className="flex items-center justify-center h-screen">
      <Tabs defaultValue="line">
        <TabsList>
          <TabsTrigger value="line">Line</TabsTrigger>
          <TabsTrigger value="candlestick">Candle Stick</TabsTrigger>
        </TabsList>
        <TabsContent value="line">
          <Card>
            <CardHeader>
              <CardTitle>Stock Prediction Graph</CardTitle>
              <CardDescription>
                Graph showing the actual value of a stock against the predicted
                price
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartComponent data={initialData} />
            </CardContent>
            <CardFooter>
              <ToggleGroup type="single" defaultValue="day">
                <ToggleGroupItem value="day" aria-label="Toggle day">
                  Day
                </ToggleGroupItem>
                <ToggleGroupItem value="week" aria-label="Toggle week">
                  Week
                </ToggleGroupItem>
                <ToggleGroupItem value="month" aria-label="Toggle month">
                  Month
                </ToggleGroupItem>
              </ToggleGroup>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="candlestick">
          <Card>
            <CardHeader>
              <CardTitle>Stock Prediction Graph</CardTitle>
              <CardDescription>
                Graph showing the actual value of a stock against the predicted
                price
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartComponent data={fart} candle />
            </CardContent>
            <CardFooter>
              <ToggleGroup type="single" defaultValue="day">
                <ToggleGroupItem value="day" aria-label="Toggle day">
                  Day
                </ToggleGroupItem>
                <ToggleGroupItem value="week" aria-label="Toggle week">
                  Week
                </ToggleGroupItem>
                <ToggleGroupItem value="month" aria-label="Toggle month">
                  Month
                </ToggleGroupItem>
              </ToggleGroup>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
