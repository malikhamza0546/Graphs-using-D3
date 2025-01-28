import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useDerivedValue,
  interpolate
} from "react-native-reanimated";
import { getYForX } from "react-native-redash";
import { ReText, Vector, round } from "react-native-redash";
import ETH from "./ETH";
import { graphs, SIZE, GraphIndex } from "./Model";
const CURSOR = 50;
const styles = StyleSheet.create({
  cursor: {
    width: CURSOR,
    height: CURSOR,
    borderRadius: CURSOR / 2,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center"
  },
  cursorBody: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#94ED4E"
  },
  tooltip: {
    position: "absolute",

    padding: 8,
    borderRadius: 8,
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    transform: [{ translateY: -60 }] // Adjust to show above the cursor
  }
});

interface CursorProps {
  index: Animated.SharedValue<GraphIndex>;
  translation: {
    x: Animated.SharedValue<number>;
    y: Animated.SharedValue<number>;
  };
  setCircle: any;
}

const Cursor = ({ index, translation, setCircle }: CursorProps) => {
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    price: number;
  } | null>(null);
  const isActive = useSharedValue(false);
  const data = useDerivedValue(() => graphs[index.value].data);

  const price = useDerivedValue(() => {
    const p = interpolate(
      translation.y.value,
      [0, SIZE],
      [data.value.maxPrice, data.value.minPrice]
    );
    return `$ ${round(p, 2).toLocaleString("en-US", { currency: "USD" })}`;
  });

  const percentChange = useDerivedValue(
    () => `${round(data.value.percentChange, 3)}%`
  );
  const label = useDerivedValue(() => data.value.label);

  const onGestureEvent = useAnimatedGestureHandler({
    onStart: () => {
      isActive.value = true;
      runOnJS(setCircle)(false); // Hide circle on start
    },
    onActive: (event) => {
      // Clamp x and y to keep the cursor inside the canvas bounds
      translation.x.value = Math.max(0, Math.min(event.x, SIZE)); // Keep x within [0, SIZE]
      translation.y.value = Math.max(0, Math.min(event.y, SIZE)); // Keep y within [0, SIZE]

      // Update the y position based on the x value (get the corresponding y from the graph line)
      translation.y.value =
        getYForX(graphs[index.value].data.path, translation.x.value) || 0;

      // Update tooltip data (x, y, price)
      const price = translation.y.value; // You can scale this if needed
      runOnJS(setTooltipData)({
        x: translation.x.value,
        y: translation.y.value,
        price: price
      });
    },
    onEnd: () => {
      isActive.value = false;
      runOnJS(setCircle)(true); // Show circle on end
    }
  });

  const style = useAnimatedStyle(() => {
    const translateX = translation.x.value - CURSOR / 2;
    const translateY = translation.y.value - CURSOR / 2;
    return {
      transform: [
        { translateX },
        { translateY },
        { scale: withSpring(isActive.value ? 1 : 0) }
      ]
    };
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <PanGestureHandler {...{ onGestureEvent }}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.cursor, style]}>
            <View style={styles.cursorBody} />
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>

      {/* Tooltip */}
      {tooltipData && isActive.value === true && (
        <View
          style={[
            styles.tooltip,
            {
              left: tooltipData.x - 40, // Adjust for better positioning
              top: tooltipData.y - 30 // Adjust to move above the cursor
            }
          ]}
        >
          <ReText
            style={{ color: "black", fontSize: 16, fontWeight: "800" }}
            text={price}
          />
          <Text style={{ color: "#7DCD41", fontSize: 10 }}>
            {"+4.46 (+2.44%)"}
          </Text>
        </View>
      )}
    </View>
  );
};

export default Cursor;
