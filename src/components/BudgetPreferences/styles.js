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
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    borderColor: COLORS.perfilMetaBorda,
    backgroundColor: COLORS.perfilLimiteCategoriaFundo,
  },

  // Texto descritivo (rótulo)
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.perfilLimiteCategoriaTexto,
    lineHeight: 20,
  },

  // Texto do valor principal (destaque)
  value: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
    color: COLORS.perfilMetaValor,
  },

  // Container em linha para categorias
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  // Caixa menor para cada categoria de gasto
  smallBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.perfilMetaBorda,
    borderRadius: 14,
    backgroundColor: COLORS.perfilLimiteCategoriaFundo,
    padding: 12,
  },

  // Seção de categorias com título
  categoriesSection: {
    marginTop: 4,
  },

  // Título da seção de categorias
  categoriesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.perfilLimiteCategoriaTexto,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
});
