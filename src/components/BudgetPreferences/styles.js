/**
 * Arquivo:BudgetPreferences/styles.js
 * Descrição: Estilos do componente BudgetPreferences, responsáveis pela
 * organização visual dos elementos como caixas, textos e layout em linha.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importação do módulo de estilos do React Native
import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

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
    borderColor: COLORS.perfilLimiteCategoriaBorda,
    borderRadius: 10,
    backgroundColor: COLORS.perfilLimiteCategoriaFundo,
  },

  // Texto descritivo (rótulo)
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.perfilLimiteCategoriaTexto,
  },

  // Texto do valor principal (destaque)
  value: {
    fontSize: 12,
    marginTop: 4,
    color: COLORS.perfilLimiteCategoriaValor,
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
    borderColor: COLORS.perfilLimiteCategoriaBorda,
    borderRadius: 10,
    backgroundColor: COLORS.perfilLimiteCategoriaFundo,
    padding: 10,
  },
});
