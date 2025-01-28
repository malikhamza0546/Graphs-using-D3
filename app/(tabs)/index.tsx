import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Dimensions } from "react-native";
import Svg, {
  Circle,
  Path,
  LinearGradient,
  Stop,
  Line,
  Text as SvgText
} from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { mixPath, useVector } from "react-native-redash";
import { parse, serialize } from "react-native-redash";
import { GraphIndex, graphs, SIZE } from "./Model";
import Header from "./Header";
import Cursor from "./Cursor";

const { width } = Dimensions.get("window");
const AnimatedPath = Animated.createAnimatedComponent(Path);

const SELECTION_WIDTH = width - 32;
const BUTTON_WIDTH = (width - 32) / graphs.length;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center"
  },
  backgroundSelection: {
    backgroundColor: "#f3f3f3",
    ...StyleSheet.absoluteFillObject,
    width: BUTTON_WIDTH,
    borderRadius: 8
  },
  selection: {
    flexDirection: "row",
    width: SELECTION_WIDTH,
    alignSelf: "center",
    marginTop: 20
    // backgroundColor: "red"
  },
  labelContainer: {
    padding: 16,
    width: BUTTON_WIDTH
  },
  label: {
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
    textAlign: "center"
  },
  yAxisLabelsContainer: {
    position: "absolute", // Position the labels outside the SVG
    left: -50, // Align to the left
    top: 0, // Top align with the graph
    bottom: 0, // Ensure it stretches to the bottom
    width: 50, // Define a fixed width for the labels
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  yaxisLabel: {
    fontSize: 10, // Ensure this is the same fontSize used in renderXAxis
    color: "black", // Adjust other styles if needed
    textAlign: "right"
  }
});

const HomeScreen = () => {
  const translation = useVector();
  const transition = useSharedValue(0);
  const previous = useSharedValue<GraphIndex>(0);
  const current = useSharedValue<GraphIndex>(0);

  // Keep track of the updated graph data
  const [currentGraph, setcurrentGraph] = useState(graphs[current.value].data);
  const [circle, setCircle] = useState(true);

  // Handle graph switch
  const handleGraphChange = (index: GraphIndex) => {
    previous.value = current.value;
    transition.value = 0;
    current.value = index;
    transition.value = withTiming(1);

    // Update graph data and trigger re-render
    setcurrentGraph(graphs[index].data);
  };

  // Retrieve scaleX and scaleY from the current graph
  const scaleX = currentGraph.scaleX;
  const scaleY = currentGraph.scaleY;

  // Calculate the new spot position based on the current graph
  const spotX = scaleX(currentGraph.dates[0]); // Use the first date from the current graph
  const spotY = scaleY(currentGraph.prices[0]); // Use the first price from the current graph

  // Animated props for the line path
  const animatedProps = useAnimatedProps(() => {
    const previousPath = graphs[previous.value]?.data?.path; // Ensure `previousPath` is defined
    const currentPath = graphs[current.value]?.data?.path; // Ensure `currentPath` is defined

    if (!previousPath || !currentPath) {
      return { d: "" }; // Ensure that the path is always defined
    }

    return {
      d: mixPath(transition.value, previousPath, currentPath)
    };
  });

  const areaAnimatedProps = useAnimatedProps(() => {
    const previousArea = graphs[previous.value]?.data?.area;
    const currentArea = graphs[current.value]?.data?.area;

    if (!previousArea || !currentArea) {
      return { d: "" };
    }

    return {
      d: mixPath(transition.value, previousArea, currentArea)
    };
  });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(BUTTON_WIDTH * current.value) }]
  }));

  // Get the min and max values for both X and Y axes
  const xMin = Math.min(...currentGraph.dates);
  const xMax = Math.max(...currentGraph.dates);
  const yMin = Math.min(...currentGraph.prices);
  const yMax = Math.max(...currentGraph.prices);

  // Calculate step for X and Y axis based on range and desired ticks (5 ticks in this case)
  const xStep = (xMax - xMin) / 4; // Divide by 4 to get 5 intervals (5 ticks)
  const yStep = (yMax - yMin) / 4; // Divide by 4 to get 5 intervals (5 ticks)

  // Function to render axis ticks for X and Y axes with a limit of 5 values
  const renderXAxis = () => {
    const xTicks = [];
    for (let i = 0; i <= 4; i++) {
      const xValue = xMin + i * xStep; // xValue is a timestamp
      const xPosition = scaleX(xValue);

      // Convert timestamp to a readable date
      const date = new Date(xValue * 1000); // Convert from seconds to milliseconds
      const formattedDate = `${date.getDate()}/${
        date.getMonth() + 1
      }/${date.getFullYear()}`;
      const formattedTime = `${date.getHours()}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      if (xPosition >= 0 && xPosition <= SIZE) {
        xTicks.push(
          <React.Fragment key={`xTick-${i}`}>
            {/* Tick Line */}
            <Line
              x1={xPosition}
              y1={SIZE} // Starting from the bottom of the graph
              x2={xPosition}
              y2={0} // Ending at the top of the graph (highest Y-axis point)
              stroke="black"
              strokeWidth={1}
              strokeDasharray="4, 4" // Creates a dotted line
            />
            {/* Tick Label */}
            <SvgText
              x={xPosition}
              y={SIZE + 15} // Position label slightly below the axis
              fontSize="10"
              fill="black"
              textAnchor="middle"
            >
              {formattedDate} {/* Or use `formattedTime` for time */}
            </SvgText>
          </React.Fragment>
        );
      }
    }
    return xTicks;
  };

  // const renderYAxis = () => {
  //   const yTicks = [];
  //   const svgHeight = SIZE; // Replace with your actual SVG height

  //   for (let i = 0; i <= 4; i++) {
  //     const yValue = yMin + i * yStep;

  //     // Flip the yPosition
  //     const yPosition = svgHeight - scaleY(yValue);

  //     yTicks.push(
  //       <React.Fragment key={`yTick-${i}`}>
  //         <SvgText
  //           x={30} // Adjust the position to ensure labels appear correctly
  //           y={yPosition} // Center the label vertically with the tick mark
  //           fontSize="10"
  //           fill="black"
  //           textAnchor="end"
  //         >
  //           {yValue.toFixed(0)} {/* Display the value with no decimal */}
  //         </SvgText>
  //       </React.Fragment>
  //     );
  //   }
  //   return yTicks;
  // };

  const renderYAxis = () => {
    const yTicks = [];
    const svgHeight = SIZE;

    for (let i = 0; i <= 4; i++) {
      const yValue = yMin + i * yStep;
      const yPosition = svgHeight - scaleY(yValue);

      yTicks.push(
        <View
          key={`yTick-${i}`}
          style={{ position: "absolute", top: yPosition }}
        >
          <Text style={styles.yaxisLabel}>{yValue.toFixed(0)}</Text>
        </View>
      );
    }
    return yTicks;
  };
  console.log(
    typeof animatedProps?.initial?.value?.d,
    "animatedProps.danimatedProps.d"
  );

  return (
    <View style={styles.container}>
      {/* <Header translation={translation} index={current} /> */}
      <View
        style={{
          // backgroundColor: "red",
          paddingLeft: 0
          // justifyContent: "center",
          // alignItems: "center"
        }}
      >
        <View style={styles.yAxisLabelsContainer}>{renderYAxis()}</View>
        <Svg
          viewBox={`0 0 ${SIZE + 20} ${SIZE + 20}`}
          width={SIZE + 20}
          height={SIZE + 20}
        >
          {/* Define a linear gradient */}
          <LinearGradient
            id="paint0_linear_6389_71142"
            x1="50%"
            y1="0.52002%"
            x2="50%"
            y2="100%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="rgba(148, 237, 78, 0.5)" />
            <Stop offset="46.679%" stopColor="rgba(229, 255, 208, 0.5)" />
            <Stop offset="100%" stopColor="rgba(255, 255, 255, 1)" />
          </LinearGradient>

          {/* The area below the graph line */}

          {/* The animated path for the line */}
          <AnimatedPath
            animatedProps={animatedProps}
            fill="transparent"
            stroke="#94ED4E"
            strokeWidth={5}
          />

          <AnimatedPath
            animatedProps={areaAnimatedProps}
            fill="url(#paint0_linear_6389_71142)" // Optional: Add a gradient or color for the area fill
            stroke="none"
          />
          {/* Place a circle using the updated scaleX and scaleY */}
          {circle === true && (
            // <Circle cx={spotX} cy={spotY} r={10} fill="red" />

            <Circle
              cx={spotX}
              cy={spotY}
              r={5}
              fill="#FFFFFF"
              stroke="#94ED4E"
              strokeWidth={2}
            />
          )}

          {/* <Path
            d={`M0,${SIZE} L${animatedProps.d} L${SIZE},${SIZE} Z`} // Create a path under the graph line
            fill="rgba(0, 188, 212, 0.1)" // You can change the color here
          /> */}

          <Line
            x1={0} // Start at the left edge
            y1={SIZE} // Positioned at the X-axis level
            x2={SIZE} // End at the right edge
            y2={SIZE} // Same Y position to make it horizontal
            stroke="black"
            strokeWidth={1}
            strokeDasharray="4, 4" // Creates a dotted effect
          />
          {/* Render X and Y Axis */}
          {renderXAxis()}
          {/* {renderYAxis()} */}
        </Svg>
        <Cursor
          translation={translation}
          index={current}
          setCircle={setCircle}
        />
      </View>
      <View style={styles.selection}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.backgroundSelection, style]} />
        </View>

        {/* Map through graphs and update current on press */}
        {graphs.map((graph, index) => (
          <TouchableWithoutFeedback
            key={graph.label}
            onPress={() => handleGraphChange(index as GraphIndex)} // Updated here
          >
            <Animated.View style={[styles.labelContainer]}>
              <Text style={styles.label}>{graph.label}</Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        ))}
      </View>
    </View>
  );
};

export default HomeScreen;
