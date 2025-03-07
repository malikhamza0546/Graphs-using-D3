/* eslint-disable camelcase */
import * as shape from "d3-shape";
import { scaleLinear } from "d3-scale";
import { Dimensions } from "react-native";
import { parse } from "react-native-redash";

import data from "./data.json";

export const SIZE = Dimensions.get("window").width / 1.5;

interface Amount {
  amount: string;
  currency: string;
  scale: string;
}

interface PercentChange {
  hour: number;
  day: number;
  week: number;
  month: number;
  year: number;
}

interface LatestPrice {
  amount: Amount;
  timestamp: string;
  percent_change: PercentChange;
}

type PriceList = [string, number][];

interface DataPoints {
  percent_change: number;
  prices: PriceList;
}

interface Prices {
  latest: string;
  latest_price: LatestPrice;
  hour: DataPoints;
  day: DataPoints;
  week: DataPoints;
  month: DataPoints;
  year: DataPoints;
  all: DataPoints;
}

const values = data.data.prices as Prices;
const POINTS = 60;

// In model.tsx

const buildGraph = (datapoints: DataPoints, label: string) => {
  const priceList = datapoints.prices.slice(0, POINTS);
  const formattedValues = priceList.map(
    (price) => [parseFloat(price[0]), price[1]] as [number, number]
  );

  const prices = formattedValues.map((value) => value[0]);
  const dates = formattedValues.map((value) => value[1]);

  console.log(prices, dates, "pricesdates");

  const scaleX = scaleLinear()
    .domain([Math.min(...dates), Math.max(...dates)])
    .range([0, SIZE]);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const scaleY = scaleLinear().domain([minPrice, maxPrice]).range([0, SIZE]);
  let stringpath = parse(
    shape
      .line()
      .x(([, x]) => scaleX(x) as number)
      .y(([y]) => scaleY(y) as number)
      .curve(shape.curveBasis)(formattedValues) as string
  );

  const area = parse(
    shape
      .area()
      .x(([, x]) => scaleX(x) as number)
      .y0(SIZE) // Start the area fill from the bottom (Y = SIZE)
      .y1(([y]) => scaleY(y) as number) // End at the scaled price
      .curve(shape.curveBasis)(formattedValues) as string
  );

  return {
    label,
    minPrice,
    maxPrice,
    percentChange: datapoints.percent_change,
    path: parse(
      shape
        .line()
        .x(([, x]) => scaleX(x) as number)
        .y(([y]) => scaleY(y) as number)
        .curve(shape.curveBasis)(formattedValues) as string
    ),
    area, // Add area property here
    highestX: scaleX(dates[dates.length - 1]),
    highestY: scaleY(prices[prices.length - 1]),
    scaleX,
    scaleY,
    dates, // Include dates in the returned object
    prices // Include prices in the returned object
  };
};

export const graphs = [
  {
    label: "1D",
    value: 1,
    data: buildGraph(values.day, "Today")
  },
  {
    label: "1H",
    value: 0,
    data: buildGraph(values.hour, "Last Hour")
  },
  {
    label: "1M",
    value: 2,
    data: buildGraph(values.month, "Last Month")
  },
  {
    label: "1Y",
    value: 3,
    data: buildGraph(values.year, "This Year")
  },
  {
    label: "all",
    value: 4,
    data: buildGraph(values.all, "All time")
  }
] as const;

export type GraphIndex = 0 | 1 | 2 | 3 | 4;
