"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ChartComponent from "@/components/ui/ChartComponent";
import { DatePickerWithRange } from "@/components/ui/date-range";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { addDays } from "date-fns";
import { CandlestickData, Time, UTCTimestamp } from "lightweight-charts";
import { Lock, Settings, Unlock } from "lucide-react";
import React from "react";
import { DateRange } from "react-day-picker";
enum AlpacaAPIError {
  Forbidden,
  NotFound,
}
const fetchStockData = async (
  symbols: string,
  timeframe: string,
  start: string,
  end: string,
  next_page_token: string | null,
  API_KEY_ID: string,
  API_SECRET_KEY: string
) => {
  return fetch(
    `https://data.alpaca.markets/v2/stocks/bars?symbols=${symbols}&timeframe=${timeframe}&start=${start}&end=${end}&limit=1000&adjustment=raw&feed=sip${
      next_page_token
        ? "&page_token=" + encodeURIComponent(next_page_token)
        : ""
    }&sort=asc`,
    {
      method: "GET",
      headers: {
        "APCA-API-KEY-ID": API_KEY_ID,
        "APCA-API-SECRET-KEY": API_SECRET_KEY,
      },
    }
  )
    .then((res) => {
      console.log("res", res);
      if (res.status === 403) {
        throw AlpacaAPIError.Forbidden;
      }
      if (res.status === 404) {
        throw AlpacaAPIError.NotFound;
      }
      return res.text();
    })
    .then((value) => JSON.parse(value))
    .catch((error) => {
      console.error(error);
      throw error;
    });
};

export default function Home() {
  const [candleStickData, setCandleStickData] = React.useState<
    CandlestickData<Time>[]
  >([]);
  const [symbol, setSymbol] = React.useState("AAPL");
  const [alpacaKey, setAlpacaKey] = React.useState("");
  const [alpacaSecret, setAlpacaSecret] = React.useState("");
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20),
  });
  const [keyHidden, setKeyHidden] = React.useState(false);
  const [secretHidden, setSecretHidden] = React.useState(false);
  const [error, setError] = React.useState<AlpacaAPIError>();
  React.useEffect(() => {
    const previousKey = localStorage.getItem("APCA-API-KEY-ID");
    const previousSecret = localStorage.getItem("APCA-API-SECRET-KEY");
    if (previousKey) {
      setAlpacaKey(previousKey);
    }
    if (previousSecret) {
      setAlpacaSecret(previousSecret);
    }
  }, []);
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (alpacaKey && alpacaSecret) {
        localStorage.setItem("APCA-API-KEY-ID", alpacaKey);
        localStorage.setItem("APCA-API-SECRET-KEY", alpacaSecret);
        (async () => {
          setError(undefined);
          try {
            setCandleStickData([]);
            if (date && date.from && date.to) {
              const aggregatedCandleStickData = [];
              const start = encodeURIComponent(date.from.toISOString());
              const end = encodeURIComponent(date.to.toISOString());
              const initialData = await fetchStockData(
                symbol,
                "1Min",
                start,
                end,
                null,
                alpacaKey,
                alpacaSecret
              );
              const initial = initialData.bars[symbol].map(
                ({ o, h, l, c, t }) => {
                  const date = new Date(t);
                  const time = (date.getTime() / 1000) as UTCTimestamp;
                  return {
                    open: o,
                    high: h,
                    low: l,
                    close: c,
                    time,
                  };
                }
              );
              aggregatedCandleStickData.push(...initial);
              let npt = initialData.next_page_token;
              while (npt) {
                const data = await fetchStockData(
                  symbol,
                  "1Min",
                  start,
                  end,
                  npt,
                  alpacaKey,
                  alpacaSecret
                );
                npt = data.next_page_token;
                const next_page = data.bars[symbol].map(({ o, h, l, c, t }) => {
                  const date = new Date(t);
                  const time = (date.getTime() / 1000) as UTCTimestamp;
                  return {
                    open: o,
                    high: h,
                    low: l,
                    close: c,
                    time,
                  };
                });
                aggregatedCandleStickData.push(...next_page);
              }
              setCandleStickData(aggregatedCandleStickData);
            }
          } catch (e: unknown) {
            if (e === AlpacaAPIError.Forbidden) {
              setError(AlpacaAPIError.Forbidden);
            } else if (e === AlpacaAPIError.NotFound) {
              setError(AlpacaAPIError.NotFound);
            } else {
              console.error("An unexpected error occurred:", e);
            }
          }
        })();
      }
    }, 1000);
    return () => {
      clearTimeout(timeout);
    };
  }, [symbol, date, alpacaKey, alpacaSecret]);

  const handleChangeKey = (event: React.ChangeEvent<HTMLInputElement>): void =>
    setAlpacaKey(event.target.value);
  const handleChangeSecret = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => setAlpacaSecret(event.target.value);
  return (
    <div className="flex items-center justify-center h-screen">
      <Tabs defaultValue="candlestick">
        <TabsList>
          <TabsTrigger value="candlestick">Candle Stick</TabsTrigger>
        </TabsList>
        <TabsContent value="candlestick">
          <Card>
            <CardHeader className="flex-row justify-between">
              <span>
                <CardTitle>Stock Prediction Graph</CardTitle>
                <CardDescription>
                  Graph showing the actual value of a stock against the
                  predicted price
                </CardDescription>
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"ghost"}>
                    <Settings />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="flex flex-col gap-2">
                    <p className="font-bold">Alpaca Key and Secret</p>
                    <InputWithLock
                      value={alpacaKey}
                      onChange={handleChangeKey}
                      placeholder="APCA-API-KEY-ID"
                      hidden={keyHidden}
                      setHidden={setKeyHidden}
                    />
                    <InputWithLock
                      value={alpacaSecret}
                      onChange={handleChangeSecret}
                      placeholder="APCA-API-SECRET-KEY"
                      hidden={secretHidden}
                      setHidden={setSecretHidden}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardContent>
              <div>
                {error === AlpacaAPIError.Forbidden && (
                  <span className="z-50 mt-24 ml-10 absolute flex flex-row gap-1">
                    <p>Press the settings cog</p>
                    <span className="flex flex-row items-center">
                      (<Settings size={16} />)
                    </span>
                    <p>and add a valid alpaca key and secret</p>
                  </span>
                )}
                {error === AlpacaAPIError.NotFound && (
                  <span className="z-50 mt-24 ml-10 absolute flex flex-row gap-1">
                    <p>Unable to retrieve data from Alpaca API</p>
                  </span>
                )}
                <ChartComponent data={candleStickData} candle />
              </div>
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
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ticker Symbol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AAPL">AAPL</SelectItem>
                  <SelectItem value="TSLA">TSLA</SelectItem>
                  <SelectItem value="MSFT">MSFT</SelectItem>
                </SelectContent>
              </Select>
              <DatePickerWithRange state={[date, setDate]} />
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const InputWithLock = ({
  placeholder,
  value,
  onChange,
  hidden,
  setHidden,
}: React.ComponentProps<"input"> & {
  hidden: boolean;
  setHidden: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      type={hidden ? "password" : ""}
    >
      <TooltipProvider
        delayDuration={100}
        skipDelayDuration={100}
        disableHoverableContent={false}
      >
        <Tooltip>
          <TooltipTrigger>
            <Button
              aria-label="show"
              onClick={() => setHidden(!hidden)}
              variant="link"
            >
              {hidden ? <Lock /> : <Unlock />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hidden ? "Show" : "Hide"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Input>
  );
};
