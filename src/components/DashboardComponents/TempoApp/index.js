import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { BarChart } from "react-native-gifted-charts";

export default function TempoApp() {

  const barData = [
    {
      value: 65,
      label: "Shein",
      frontColor: "#5A627F",
      spacing: 18,
      labelWidth: 70,
    },
    {
      value: 30,
      label: "Shopee",
      frontColor: "#7C86A8",
      spacing: 18,
      labelWidth: 70,
    },
    {
      value: 15,
      label: "Mercado Livre",
      frontColor: "#B0B7D6",
      labelWidth: 110,
    }
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.card}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tempo em sites (em minutos)</Text>
        </View>

        {/* Gráfico */}
        <BarChart
          data={barData}
          horizontal
          barWidth={18}
          spacing={22}
          roundedTop
          roundedBottom
          xAxisThickness={0}
          yAxisThickness={0}
          hideRules={false}
          rulesColor="#D9D9D9"
          xAxisLabelTextStyle={{ color: "#444" }}
          yAxisTextStyle={{ color: "#444" }}
          noOfSections={4}
          maxValue={70}
          isAnimated
        />

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 20,
    padding: 16,
    backgroundColor: "#ECECEC",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#6B6B8F",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },


  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
    marginBottom: 15,
  },

  menu: {
    fontSize: 22,
    color: "#444",
  },
});