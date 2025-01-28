import React, { useCallback, useEffect } from "react";
import {
  runOnJS,
  useAnimatedReaction,
  withSpring,
  useSharedValue
} from "react-native-reanimated";
import { Circle } from "@shopify/react-native-skia";
import type { SelectionDotProps } from "react-native-graph";

export default function SelectionDot({
  isActive,
  color,
  circleX,
  circleY
}: SelectionDotProps): React.ReactElement {
  const circleRadius = useSharedValue(0);

  const setIsActive = useCallback(
    (active: boolean) => {
      circleRadius.value = withSpring(active ? 5 : 0, {
        mass: 1,
        stiffness: 1000,
        damping: 50,
        velocity: 0
      });
    },
    [circleRadius]
  );

  // React to changes in isActive
  useAnimatedReaction(
    () => isActive.value,
    (active) => {
      runOnJS(setIsActive)(active);
    },
    [isActive, setIsActive]
  );

  // Ensure the dot is visible on initial render
  useEffect(() => {
    setIsActive(true); // Activate the dot initially
  }, [setIsActive]);

  return (
    <>
      {/* Outer Circle - Border */}
      <Circle
        cx={circleX}
        cy={circleY}
        r={circleRadius.value + 7} // Outer radius (border size = 2)
        color={"#94ED4E"} // Border color
      />
      {/* Inner Circle - White */}
      <Circle
        cx={circleX}
        cy={circleY}
        r={circleRadius.value + 3} // Inner radius
        color={"white"} // Inner circle color
      />
    </>
  );
}
