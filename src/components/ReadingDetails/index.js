import { styles } from "./styles";
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
export default function ReadingDetails({
  label = 'Sobre estes dados',
  children,
  presentation = 'inline',
  active = true
}) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!active) setExpanded(false);
  }, [active]);
  return <View style={styles.container}>
      <Pressable accessibilityRole="button" accessibilityState={{
      expanded
    }} onPress={() => setExpanded(!expanded)} style={styles.button}>
        <Text style={styles.label}>{label}</Text>
        <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#76658A" accessible={false} />
      </Pressable>
      {expanded && active && (presentation === 'sheet' ? <Modal transparent visible animationType="slide" onRequestClose={() => setExpanded(false)}>
        <View style={styles.scrim}><View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}><Text accessibilityRole="header" style={styles.sheetTitle}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Fechar ${label}`} onPress={() => setExpanded(false)} style={styles.close}><MaterialCommunityIcons name="close" size={24} color={DASHBOARD_THEME.colors.ink} /></Pressable></View>
          <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
        </View></View>
      </Modal> : <View style={styles.content}>{children}</View>)}
    </View>;
}
