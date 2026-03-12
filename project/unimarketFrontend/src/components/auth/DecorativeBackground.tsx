import React from "react";
import { View, StyleSheet } from "react-native";

interface DecorativeBackgroundProps {
  compact?: boolean;
}

export const DecorativeBackground: React.FC<DecorativeBackgroundProps> = ({ compact = false }) => (
  <View style={[styles.canvas, compact && styles.canvasCompact]} pointerEvents="none">
    <View style={[styles.blob, styles.blobOne, compact && styles.blobOneCompact]} />
    <View style={[styles.blob, styles.blobTwo, compact && styles.blobTwoCompact]} />
    <View style={[styles.blob, styles.blobThree, compact && styles.blobThreeCompact]} />
    <View style={[styles.circle, styles.circleOne, compact && styles.circleOneCompact]} />
    <View style={[styles.circle, styles.circleTwo, compact && styles.circleTwoCompact]} />
  </View>
);

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#EAF0FF",
    overflow: "hidden",
  },
  canvasCompact: {
    backgroundColor: "#EFF3FF",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blobOne: {
    width: 340,
    height: 340,
    backgroundColor: "#CAD6FF",
    top: -120,
    right: -70,
  },
  blobOneCompact: {
    width: 260,
    height: 260,
    top: -120,
    right: -110,
  },
  blobTwo: {
    width: 290,
    height: 290,
    backgroundColor: "#8EA3FF",
    opacity: 0.45,
    bottom: -140,
    left: -90,
  },
  blobTwoCompact: {
    width: 220,
    height: 220,
    bottom: -120,
    left: -90,
  },
  blobThree: {
    width: 250,
    height: 250,
    backgroundColor: "#4963D6",
    opacity: 0.2,
    top: "38%",
    left: -140,
  },
  blobThreeCompact: {
    width: 200,
    height: 200,
    top: "28%",
    left: -120,
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  circleOne: {
    width: 98,
    height: 98,
    top: 112,
    right: 52,
    opacity: 0.65,
  },
  circleOneCompact: {
    width: 74,
    height: 74,
    top: 78,
    right: 30,
  },
  circleTwo: {
    width: 52,
    height: 52,
    bottom: 148,
    left: 40,
    opacity: 0.8,
  },
  circleTwoCompact: {
    width: 40,
    height: 40,
    bottom: 86,
    left: 22,
  },
});
