import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { BarChart } from "react-native-gifted-charts";

export default function GastosTotais() {

  const gasto = 1250.78;
  const meta = 800;
  const porcentagem = Math.round((gasto / meta - 1) * 100);

  const data = [
    {
      value: meta,
      label: "Meta",
      frontColor: "#626784",
    },
    {
      value: gasto,
      label: "Gasto",
      frontColor: "#C79AB0",
    }
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.card}>

        <Text style={styles.title}>Gastos Totais</Text>

        <Text style={styles.valor}>R$ 1.250,78</Text>
        <Text style={styles.meta}>
          Meta: <Text style={{color:"#6E63B5"}}>R$800,00</Text>
        </Text>

        <Text style={styles.excedente}>+{porcentagem}% acima da meta</Text>

        <BarChart horizontal
          data={data}
          barWidth={35}
          spacing={20}
          roundedTop
          roundedBottom
          yAxisThickness={0}
          xAxisThickness={0}
            hideRules
          noOfSections={4}
          maxValue={1400}
          isAnimated
          hideYAxisText
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

  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#222",
  },

  valor: {
    fontSize: 36,
    color: "#C02C7A",
    marginTop: 10,
    fontWeight: "600",
  },

  meta: {
    fontSize: 18,
    marginTop: 8,
  },

  excedente: {
    color: "#C40000",
    fontSize: 18,
    marginTop: 4,
    fontWeight: "600",
    marginBottom: 10,
    marginLeft: 20,
  },
});