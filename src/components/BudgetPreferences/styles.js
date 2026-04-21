/**
 * Arquivo:BudgetPreferences/styles.js
 * Descrição: Estilos do componente BudgetPreferences, responsáveis pela
 * organização visual dos elementos como caixas, textos e layout em linha.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importação do módulo de estilos do React Native
import { StyleSheet } from 'react-native';

/**
 * Objeto de estilos do componente
 * Define layout, espaçamento, tipografia e estrutura visual
 */
export default StyleSheet.create({

  // Caixa principal que exibe o valor total de gasto
  mainBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(137, 196, 209, 0.9)',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },

  // Texto descritivo (rótulo)
  label: {
    fontSize: 13,
  },

  // Texto do valor principal (destaque)
  value: {
    fontWeight: 'bold',
    marginTop: 4,
  },

  // Container em linha para categorias
  row: {
    flexDirection: 'row',
    gap: 10,
  },

  // Caixa menor para cada categoria de gasto
  smallBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(137, 196, 209, 0.9)',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    padding: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 12,
    marginTop: 4,
  }

});