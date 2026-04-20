/**
 * Arquivo: ProfileCard/index.js
 * Descrição: Componente reutilizável que encapsula seções do perfil,
 * exibindo um título, botão de edição e conteúdo interno dinâmico.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para o componente
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import styles from './styles';

/**
 * Componente: ProfileCard
 * Responsabilidade: Estruturar visualmente seções com título, ação de edição
 * e renderização de conteúdo filho (children)
 */
export default function ProfileCard({ title, children, onEdit }) {
  return (
    // Container principal do card
    <View style={styles.container}>

      {/* Cabeçalho com título e ação de edição */}
      <View style={styles.header}>
        
        {/* Título da seção */}
        <Text style={styles.title}>
          {title}
        </Text>

        {/* Botão de edição */}
        <TouchableOpacity onPress={onEdit}>
          <Feather name="edit-2" size={18} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      {/* Conteúdo dinâmico do card */}
      <View style={styles.content}>
        {children}
      </View>

    </View>
  );
}
