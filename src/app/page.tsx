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
import { Label } from "@/components/ui/label";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { addDays } from "date-fns";
import {
  BarData,
  CandlestickData,
  MouseEventParams,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import { LoaderIcon, Lock, Settings, Unlock } from "lucide-react";
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
interface AlpacaHistoricalBarDTO {
  o: number;
  h: number;
  l: number;
  c: number;
  t: string;
}

export default function Home() {
  const [candleStickData, setCandleStickData] = React.useState<
    CandlestickData<Time>[]
  >([]);
  const [ohlc, setOHLC] = React.useState<BarData<Time>>();
  const [symbol, setSymbol] = React.useState("AAPL");
  const [timeframe, setTimeframe] = React.useState("1Min");
  const [alpacaKey, setAlpacaKey] = React.useState("");
  const [alpacaSecret, setAlpacaSecret] = React.useState("");
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20),
  });
  const [loading, setLoading] = React.useState(true);
  const [keyHidden, setKeyHidden] = React.useState(false);
  const [secretHidden, setSecretHidden] = React.useState(false);
  const [error, setError] = React.useState<AlpacaAPIError>();
  function updateLegend(param: MouseEventParams<Time>): void {
    setOHLC(param.seriesData.values().next().value as BarData<Time>);
  }
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
      localStorage.setItem("APCA-API-KEY-ID", alpacaKey);
      localStorage.setItem("APCA-API-SECRET-KEY", alpacaSecret);
      setLoading(true);
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
              timeframe,
              start,
              end,
              null,
              alpacaKey,
              alpacaSecret
            );
            const initial = initialData.bars[symbol].map(
              ({ o, h, l, c, t }: AlpacaHistoricalBarDTO) => {
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
                timeframe,
                start,
                end,
                npt,
                alpacaKey,
                alpacaSecret
              );
              npt = data.next_page_token;
              const next_page = data.bars[symbol].map(
                ({ o, h, l, c, t }: AlpacaHistoricalBarDTO) => {
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
              aggregatedCandleStickData.push(...next_page);
            }
            setLoading(false);
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
          setLoading(false);
        }
      })();
    }, 1000);
    return () => {
      clearTimeout(timeout);
    };
  }, [timeframe, symbol, date, alpacaKey, alpacaSecret]);

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
                {(error === AlpacaAPIError.Forbidden ||
                  !alpacaKey ||
                  !alpacaSecret) && (
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
                {loading && (
                  <span className="z-50 mt-32 ml-72 absolute flex flex-row gap-1">
                    <LoaderIcon className="animate-spin" />
                  </span>
                )}
                <span className="absolute z-50 gap-2 flex flex-row">
                  <h1 className="font-bold">{symbol}</h1>
                  {ohlc && (
                    <>
                      <span className="flex flex-row gap-3">
                        <span className="flex flex-row gap-1">
                          <p>O</p>
                          <p>{ohlc.open.toFixed(2)}</p>
                        </span>
                        <span className="flex flex-row gap-1">
                          <p>H</p>
                          <p>{ohlc.high.toFixed(2)}</p>
                        </span>
                        <span className="flex flex-row gap-1">
                          <p>C</p>
                          <p>{ohlc.close.toFixed(2)}</p>
                        </span>
                        <span className="flex flex-row gap-1">
                          <p>L</p>
                          <p>{ohlc.low.toFixed(2)}</p>
                        </span>
                      </span>
                      <p>
                        {new Date(
                          (ohlc.time.valueOf() as number) * 1000
                        ).toLocaleString()}
                      </p>
                    </>
                  )}
                </span>
                <ChartComponent
                  data={candleStickData}
                  candle
                  updateLegend={updateLegend}
                />
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <span>
                <Label className="font-bold">Timeframe</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Frame" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1Min">Minute</SelectItem>
                    <SelectItem value="1Hour">Hour</SelectItem>
                    <SelectItem value="1Day">Day</SelectItem>
                    <SelectItem value="1Month">Month</SelectItem>
                    <SelectItem value="1Year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </span>
              <span>
                <Label className="font-bold">Ticker</Label>
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
              </span>
              <span>
                <Label className="font-bold">Date Range</Label>
                <DatePickerWithRange state={[date, setDate]} />
              </span>
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
