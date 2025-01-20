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
export default function Home() {
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
      </Tabs>
    </div>
  );
}
